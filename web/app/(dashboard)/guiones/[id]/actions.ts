"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateCtasStage,
  generateIntroStage,
  generateOutlineStage,
  generatePayoffsStage,
  generateSectionStage,
  generateStyleReviewStage,
  generateTitleStage,
  generateTransitionsStage,
} from "@/lib/scripts/anthropicClient";
import { UserFacingError, runOrGenericError } from "@/lib/errors";
import type {
  ClarificationContext,
  CtaItem,
  OutlineSection,
  PayoffItem,
  TransitionHookSet,
} from "@/lib/scripts/types";
import { Prisma, type ScriptPhase } from "@prisma/client";

async function requireAuthedUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UserFacingError("Not authenticated");
  return session.user.id;
}

async function loadClarifications(scriptId: string): Promise<ClarificationContext[]> {
  const rows = await prisma.scriptClarification.findMany({
    where: { scriptId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({ phase: r.phase, question: r.question, answer: r.answer }));
}

/** Concatenates the confirmed intro + sections (with their chosen transition
 *  hook after each, and any CTA scheduled after that section) into one
 *  plain-text script. Used both to give Etapa 7 (CTAs) the full script for
 *  context and to build Etapa 8's "generated version" to diff against the
 *  user's edit. `ctas` is null when called from the CTAs stage itself
 *  (they don't exist yet). */
function assembleScriptText(
  chosenIntro: string,
  sections: { order: number; chosenText: string | null }[],
  transitionHooks: TransitionHookSet[] | null,
  ctas: CtaItem[] | null
): string {
  const sorted = sections.slice().sort((a, b) => a.order - b.order);
  const parts: string[] = [chosenIntro];

  sorted.forEach((s) => {
    parts.push(s.chosenText ?? "");
    const cta = ctas?.find((c) => c.afterSectionOrder === s.order);
    if (cta) parts.push(`[CTA] ${cta.text}`);
    const hook = transitionHooks?.find((h) => h.afterSectionOrder === s.order);
    if (hook?.chosenText) parts.push(hook.chosenText);
  });

  const endCta = ctas?.find((c) => c.position === "end_screen");
  if (endCta) parts.push(`[CTA] ${endCta.text}`);

  return parts.join("\n\n");
}

export interface UpdateScriptPatch {
  chosenTitle?: string;
  chosenIntroAngle?: string;
  chosenIntro?: string;
  notes?: string;
}

export async function updateScript(id: string, patch: UpdateScriptPatch): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    await prisma.script.update({ where: { id }, data: patch });
  }, "No se pudo guardar el cambio.");
  revalidatePath(`/guiones/${id}`);
  revalidatePath("/guiones");
}

export async function runIntroStage(id: string): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "TITLE") {
      throw new UserFacingError("Este guion no está en la etapa de título.");
    }
    if (script.pendingClarification) {
      throw new UserFacingError("Resolvé la aclaración pendiente antes de continuar.");
    }
    if (!script.chosenTitle) {
      throw new UserFacingError("Elegí o confirmá un título antes de continuar.");
    }

    const clarifications = await loadClarifications(id);
    const output = await generateIntroStage({
      chosenTitle: script.chosenTitle,
      thumbnailDescription: script.thumbnailDescription,
      research: script.research,
      referenceScript: script.referenceScript,
      clarifications,
    });

    if (output.status === "needs_input") {
      await prisma.script.update({
        where: { id },
        data: {
          pendingClarification: { phase: "INTRO", question: output.question },
        },
      });
    } else {
      await prisma.script.update({
        where: { id },
        data: {
          introVariations: output.variations as unknown as Prisma.InputJsonValue,
          chosenIntroAngle: null,
          chosenIntro: null,
          currentPhase: "INTRO",
          pendingClarification: Prisma.JsonNull,
        },
      });
    }
  }, "No se pudo generar la intro. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}

export async function runOutlineStage(id: string, brainDump: string): Promise<void> {
  await requireAuthedUserId();
  const trimmedBrainDump = brainDump.trim();
  if (!trimmedBrainDump) throw new UserFacingError("Falta el brain dump.");

  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "INTRO") {
      throw new UserFacingError("Este guion no está en la etapa de intro.");
    }
    if (script.pendingClarification) {
      throw new UserFacingError("Resolvé la aclaración pendiente antes de continuar.");
    }
    if (!script.chosenIntro) {
      throw new UserFacingError("Elegí o confirmá una intro antes de continuar.");
    }

    const clarifications = await loadClarifications(id);
    const output = await generateOutlineStage({
      chosenTitle: script.chosenTitle ?? "",
      chosenIntro: script.chosenIntro,
      thumbnailDescription: script.thumbnailDescription,
      research: script.research,
      referenceScript: script.referenceScript,
      brainDump: trimmedBrainDump,
      clarifications,
    });

    if (output.status === "needs_input") {
      await prisma.script.update({
        where: { id },
        data: {
          brainDump: trimmedBrainDump,
          pendingClarification: { phase: "OUTLINE", question: output.question },
        },
      });
    } else {
      await prisma.script.update({
        where: { id },
        data: {
          brainDump: trimmedBrainDump,
          outlineSections: output.sections as unknown as Prisma.InputJsonValue,
          currentPhase: "OUTLINE",
          pendingClarification: Prisma.JsonNull,
        },
      });
    }
  }, "No se pudo generar el outline. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}

export async function runPayoffsStage(id: string): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "OUTLINE") {
      throw new UserFacingError("Este guion no está en la etapa de outline.");
    }
    if (script.pendingClarification) {
      throw new UserFacingError("Resolvé la aclaración pendiente antes de continuar.");
    }
    const outlineSections = script.outlineSections as unknown as OutlineSection[] | null;
    if (!outlineSections) {
      throw new UserFacingError("Generá el outline antes de continuar.");
    }

    const clarifications = await loadClarifications(id);
    const output = await generatePayoffsStage({
      chosenTitle: script.chosenTitle ?? "",
      chosenIntro: script.chosenIntro ?? "",
      thumbnailDescription: script.thumbnailDescription,
      research: script.research,
      referenceScript: script.referenceScript,
      outlineSections,
      clarifications,
    });

    if (output.status === "needs_input") {
      await prisma.script.update({
        where: { id },
        data: { pendingClarification: { phase: "PAYOFFS", question: output.question } },
      });
    } else {
      await prisma.script.update({
        where: { id },
        data: {
          payoffs: output.payoffs as unknown as Prisma.InputJsonValue,
          currentPhase: "PAYOFFS",
          pendingClarification: Prisma.JsonNull,
        },
      });
    }
  }, "No se pudieron generar los payoffs. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}

export async function startSectionsStage(id: string): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "PAYOFFS") {
      throw new UserFacingError("Este guion no está en la etapa de payoffs.");
    }
    const outlineSections = script.outlineSections as unknown as OutlineSection[] | null;
    if (!outlineSections) {
      throw new UserFacingError("Generá el outline antes de continuar.");
    }

    await prisma.scriptSection.createMany({
      data: outlineSections.map((s) => ({ scriptId: id, order: s.order })),
      skipDuplicates: true,
    });
    await prisma.script.update({ where: { id }, data: { currentPhase: "SECTIONS" } });
  }, "No se pudo arrancar la etapa de secciones. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}

export async function generateSection(
  scriptId: string,
  order: number,
  wantsTwoVariations: boolean
): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id: scriptId } });
    if (script.currentPhase !== "SECTIONS") {
      throw new UserFacingError("Este guion no está en la etapa de secciones.");
    }
    const section = await prisma.scriptSection.findUniqueOrThrow({
      where: { scriptId_order: { scriptId, order } },
    });
    if (section.pendingClarification) {
      throw new UserFacingError("Resolvé la aclaración pendiente de esta sección antes de continuar.");
    }

    const outlineSections = script.outlineSections as unknown as OutlineSection[] | null;
    const payoffs = script.payoffs as unknown as PayoffItem[] | null;
    const outlineSection = outlineSections?.find((s) => s.order === order);
    const payoffItem = payoffs?.find((p) => p.sectionOrder === order);
    if (!outlineSection || !payoffItem) {
      throw new UserFacingError("Falta el outline o el payoff de esta sección.");
    }

    const previousRows = await prisma.scriptSection.findMany({
      where: { scriptId, order: { lt: order }, chosenText: { not: null } },
      orderBy: { order: "asc" },
    });
    const previousSections = previousRows.map((r) => ({
      order: r.order,
      workingTitle: outlineSections?.find((s) => s.order === r.order)?.workingTitle ?? "",
      text: r.chosenText ?? "",
    }));

    const clarifications = await loadClarifications(scriptId);
    const output = await generateSectionStage({
      chosenTitle: script.chosenTitle ?? "",
      chosenIntro: script.chosenIntro ?? "",
      thumbnailDescription: script.thumbnailDescription,
      research: script.research,
      referenceScript: script.referenceScript,
      order,
      totalSections: outlineSections?.length ?? 0,
      workingTitle: outlineSection.workingTitle,
      openProblem: outlineSection.openProblem,
      payoffPreview: outlineSection.payoffPreview,
      payoffText: payoffItem.payoff,
      payoffQuestion: payoffItem.question,
      previousSections,
      wantsTwoVariations,
      clarifications,
    });

    if (output.status === "needs_input") {
      await prisma.scriptSection.update({
        where: { scriptId_order: { scriptId, order } },
        data: { pendingClarification: { question: output.question, wantsTwoVariations } },
      });
    } else {
      await prisma.scriptSection.update({
        where: { scriptId_order: { scriptId, order } },
        data: {
          variations: output.variations as unknown as Prisma.InputJsonValue,
          chosenText: null,
          pendingClarification: Prisma.JsonNull,
        },
      });
    }
  }, "No se pudo generar la sección. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${scriptId}`);
}

export async function retrySectionStage(
  scriptId: string,
  order: number,
  answer: string
): Promise<void> {
  await requireAuthedUserId();
  const trimmedAnswer = answer.trim();
  if (!trimmedAnswer) throw new UserFacingError("Escribí una respuesta.");

  const wantsTwoVariations = await runOrGenericError(async () => {
    const section = await prisma.scriptSection.findUniqueOrThrow({
      where: { scriptId_order: { scriptId, order } },
    });
    const pending = section.pendingClarification as unknown as {
      question: string;
      wantsTwoVariations: boolean;
    } | null;
    if (!pending) throw new UserFacingError("No hay ninguna aclaración pendiente en esta sección.");

    await prisma.scriptClarification.create({
      data: { scriptId, phase: "SECTIONS", question: pending.question, answer: trimmedAnswer },
    });
    await prisma.scriptSection.update({
      where: { scriptId_order: { scriptId, order } },
      data: { pendingClarification: Prisma.JsonNull },
    });
    return pending.wantsTwoVariations;
  }, "No se pudo guardar la respuesta. Probá de nuevo en un momento.");

  // Re-run the section generation now that the clarification is answered
  // and persisted (it'll be replayed by loadClarifications inside generateSection).
  await generateSection(scriptId, order, wantsTwoVariations);
}

export async function chooseSectionVariation(
  scriptId: string,
  order: number,
  chosenText: string
): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    await prisma.scriptSection.update({
      where: { scriptId_order: { scriptId, order } },
      data: { chosenText },
    });
  }, "No se pudo guardar la sección.");
  revalidatePath(`/guiones/${scriptId}`);
}

export async function runTransitionsStage(id: string): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "SECTIONS") {
      throw new UserFacingError("Este guion no está en la etapa de secciones.");
    }
    if (script.pendingClarification) {
      throw new UserFacingError("Resolvé la aclaración pendiente antes de continuar.");
    }
    const outlineSections = script.outlineSections as unknown as OutlineSection[] | null;
    if (!outlineSections) throw new UserFacingError("Falta el outline.");

    const sectionRows = await prisma.scriptSection.findMany({
      where: { scriptId: id },
      orderBy: { order: "asc" },
    });
    if (
      sectionRows.length !== outlineSections.length ||
      sectionRows.some((s) => !s.chosenText || s.pendingClarification)
    ) {
      throw new UserFacingError("Confirmá el texto de todas las secciones antes de continuar.");
    }

    const sections = sectionRows.map((r) => ({
      order: r.order,
      workingTitle: outlineSections.find((s) => s.order === r.order)?.workingTitle ?? "",
      text: r.chosenText ?? "",
    }));

    const clarifications = await loadClarifications(id);
    const output = await generateTransitionsStage({
      chosenTitle: script.chosenTitle ?? "",
      sections,
      clarifications,
    });

    if (output.status === "needs_input") {
      await prisma.script.update({
        where: { id },
        data: { pendingClarification: { phase: "TRANSITIONS", question: output.question } },
      });
    } else {
      await prisma.script.update({
        where: { id },
        data: {
          transitionHooks: output.hooks as unknown as Prisma.InputJsonValue,
          currentPhase: "TRANSITIONS",
          pendingClarification: Prisma.JsonNull,
        },
      });
    }
  }, "No se pudieron generar las transiciones. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}

export async function chooseTransitionHook(
  scriptId: string,
  afterSectionOrder: number,
  chosenText: string
): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id: scriptId } });
    const hooks = script.transitionHooks as unknown as TransitionHookSet[] | null;
    if (!hooks) throw new UserFacingError("Todavía no se generaron las transiciones.");

    const updated = hooks.map((h) =>
      h.afterSectionOrder === afterSectionOrder
        ? { ...h, chosenText, chosenIndex: h.options.indexOf(chosenText) }
        : h
    );
    await prisma.script.update({
      where: { id: scriptId },
      data: { transitionHooks: updated as unknown as Prisma.InputJsonValue },
    });
  }, "No se pudo guardar la transición.");
  revalidatePath(`/guiones/${scriptId}`);
}

export async function runCtasStage(id: string): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "TRANSITIONS") {
      throw new UserFacingError("Este guion no está en la etapa de transiciones.");
    }
    if (script.pendingClarification) {
      throw new UserFacingError("Resolvé la aclaración pendiente antes de continuar.");
    }
    const hooks = script.transitionHooks as unknown as TransitionHookSet[] | null;
    if (!hooks || hooks.some((h) => !h.chosenText)) {
      throw new UserFacingError("Elegí el hook de todas las transiciones antes de continuar.");
    }

    const sectionRows = await prisma.scriptSection.findMany({
      where: { scriptId: id },
      orderBy: { order: "asc" },
    });
    const fullScriptText = assembleScriptText(
      script.chosenIntro ?? "",
      sectionRows.map((r) => ({ order: r.order, chosenText: r.chosenText })),
      hooks,
      null
    );

    const clarifications = await loadClarifications(id);
    const output = await generateCtasStage({
      chosenTitle: script.chosenTitle ?? "",
      fullScriptText,
      totalSections: sectionRows.length,
      clarifications,
    });

    if (output.status === "needs_input") {
      await prisma.script.update({
        where: { id },
        data: { pendingClarification: { phase: "CTAS", question: output.question } },
      });
    } else {
      await prisma.script.update({
        where: { id },
        data: {
          ctas: output.ctas as unknown as Prisma.InputJsonValue,
          currentPhase: "CTAS",
          pendingClarification: Prisma.JsonNull,
        },
      });
    }
  }, "No se pudieron generar los CTAs. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}

export async function updateCtaText(
  scriptId: string,
  position: CtaItem["position"],
  text: string
): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id: scriptId } });
    const ctas = script.ctas as unknown as CtaItem[] | null;
    if (!ctas) throw new UserFacingError("Todavía no se generaron los CTAs.");

    const updated = ctas.map((c) => (c.position === position ? { ...c, text } : c));
    await prisma.script.update({
      where: { id: scriptId },
      data: { ctas: updated as unknown as Prisma.InputJsonValue },
    });
  }, "No se pudo guardar el CTA.");
  revalidatePath(`/guiones/${scriptId}`);
}

export async function advanceToStyleReview(id: string): Promise<void> {
  await requireAuthedUserId();
  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "CTAS") {
      throw new UserFacingError("Este guion no está en la etapa de CTAs.");
    }
    await prisma.script.update({ where: { id }, data: { currentPhase: "STYLE_REVIEW" } });
  }, "No se pudo avanzar a la etapa de feedback loop.");
  revalidatePath(`/guiones/${id}`);
}

export async function runStyleReviewStage(id: string, editedFinalScript: string): Promise<void> {
  await requireAuthedUserId();
  const trimmed = editedFinalScript.trim();
  if (!trimmed) throw new UserFacingError("Pegá la versión final editada del guion.");

  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    if (script.currentPhase !== "STYLE_REVIEW") {
      throw new UserFacingError("Este guion no está en la etapa de feedback loop.");
    }

    const sectionRows = await prisma.scriptSection.findMany({
      where: { scriptId: id },
      orderBy: { order: "asc" },
    });
    const hooks = script.transitionHooks as unknown as TransitionHookSet[] | null;
    const ctas = script.ctas as unknown as CtaItem[] | null;
    const generatedScriptText = assembleScriptText(
      script.chosenIntro ?? "",
      sectionRows.map((r) => ({ order: r.order, chosenText: r.chosenText })),
      hooks,
      ctas
    );

    const clarifications = await loadClarifications(id);
    const output = await generateStyleReviewStage({
      generatedScriptText,
      editedFinalScript: trimmed,
      clarifications,
    });

    if (output.status === "needs_input") {
      await prisma.script.update({
        where: { id },
        data: {
          editedFinalScript: trimmed,
          pendingClarification: { phase: "STYLE_REVIEW", question: output.question },
        },
      });
    } else {
      await prisma.script.update({
        where: { id },
        data: {
          editedFinalScript: trimmed,
          styleGuideReport: output.report as unknown as Prisma.InputJsonValue,
          currentPhase: "COMPLETE",
          pendingClarification: Prisma.JsonNull,
        },
      });
    }
  }, "No se pudo analizar la edición final. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}

export async function retryStage(id: string, answer: string): Promise<void> {
  await requireAuthedUserId();
  const trimmedAnswer = answer.trim();
  if (!trimmedAnswer) throw new UserFacingError("Escribí una respuesta.");

  await runOrGenericError(async () => {
    const script = await prisma.script.findUniqueOrThrow({ where: { id } });
    const pending = script.pendingClarification as unknown as {
      phase: ScriptPhase;
      question: string;
    } | null;
    if (!pending) throw new UserFacingError("No hay ninguna aclaración pendiente.");

    await prisma.scriptClarification.create({
      data: {
        scriptId: id,
        phase: pending.phase,
        question: pending.question,
        answer: trimmedAnswer,
      },
    });
    await prisma.script.update({
      where: { id },
      data: { pendingClarification: Prisma.JsonNull },
    });

    const clarifications = await loadClarifications(id);

    if (pending.phase === "TITLE") {
      const output = await generateTitleStage({
        mode: script.titleMode,
        title: script.title,
        thumbnailDescription: script.thumbnailDescription,
        research: script.research,
        referenceScript: script.referenceScript,
        clarifications,
      });
      if (output.status === "needs_input") {
        await prisma.script.update({
          where: { id },
          data: { pendingClarification: { phase: "TITLE", question: output.question } },
        });
      } else if (output.mode === "validate") {
        await prisma.script.update({
          where: { id },
          data: {
            titleAssessment: output.assessment as unknown as Prisma.InputJsonValue,
            chosenTitle: script.title,
          },
        });
      } else {
        await prisma.script.update({
          where: { id },
          data: { titleCandidates: output.candidates as unknown as Prisma.InputJsonValue },
        });
      }
    } else if (pending.phase === "INTRO") {
      const output = await generateIntroStage({
        chosenTitle: script.chosenTitle ?? "",
        thumbnailDescription: script.thumbnailDescription,
        research: script.research,
        referenceScript: script.referenceScript,
        clarifications,
      });
      if (output.status === "needs_input") {
        await prisma.script.update({
          where: { id },
          data: { pendingClarification: { phase: "INTRO", question: output.question } },
        });
      } else {
        await prisma.script.update({
          where: { id },
          data: {
            introVariations: output.variations as unknown as Prisma.InputJsonValue,
            chosenIntroAngle: null,
            chosenIntro: null,
            currentPhase: "INTRO",
          },
        });
      }
    } else if (pending.phase === "OUTLINE") {
      const output = await generateOutlineStage({
        chosenTitle: script.chosenTitle ?? "",
        chosenIntro: script.chosenIntro ?? "",
        thumbnailDescription: script.thumbnailDescription,
        research: script.research,
        referenceScript: script.referenceScript,
        brainDump: script.brainDump ?? "",
        clarifications,
      });
      if (output.status === "needs_input") {
        await prisma.script.update({
          where: { id },
          data: { pendingClarification: { phase: "OUTLINE", question: output.question } },
        });
      } else {
        await prisma.script.update({
          where: { id },
          data: {
            outlineSections: output.sections as unknown as Prisma.InputJsonValue,
            currentPhase: "OUTLINE",
          },
        });
      }
    } else if (pending.phase === "PAYOFFS") {
      const outlineSections = script.outlineSections as unknown as OutlineSection[] | null;
      if (!outlineSections) throw new UserFacingError("Falta el outline.");
      const output = await generatePayoffsStage({
        chosenTitle: script.chosenTitle ?? "",
        chosenIntro: script.chosenIntro ?? "",
        thumbnailDescription: script.thumbnailDescription,
        research: script.research,
        referenceScript: script.referenceScript,
        outlineSections,
        clarifications,
      });
      if (output.status === "needs_input") {
        await prisma.script.update({
          where: { id },
          data: { pendingClarification: { phase: "PAYOFFS", question: output.question } },
        });
      } else {
        await prisma.script.update({
          where: { id },
          data: { payoffs: output.payoffs as unknown as Prisma.InputJsonValue, currentPhase: "PAYOFFS" },
        });
      }
    } else if (pending.phase === "TRANSITIONS") {
      const outlineSections = script.outlineSections as unknown as OutlineSection[] | null;
      if (!outlineSections) throw new UserFacingError("Falta el outline.");
      const sectionRows = await prisma.scriptSection.findMany({
        where: { scriptId: id },
        orderBy: { order: "asc" },
      });
      const sections = sectionRows.map((r) => ({
        order: r.order,
        workingTitle: outlineSections.find((s) => s.order === r.order)?.workingTitle ?? "",
        text: r.chosenText ?? "",
      }));
      const output = await generateTransitionsStage({
        chosenTitle: script.chosenTitle ?? "",
        sections,
        clarifications,
      });
      if (output.status === "needs_input") {
        await prisma.script.update({
          where: { id },
          data: { pendingClarification: { phase: "TRANSITIONS", question: output.question } },
        });
      } else {
        await prisma.script.update({
          where: { id },
          data: {
            transitionHooks: output.hooks as unknown as Prisma.InputJsonValue,
            currentPhase: "TRANSITIONS",
          },
        });
      }
    } else if (pending.phase === "CTAS") {
      const hooks = script.transitionHooks as unknown as TransitionHookSet[] | null;
      const sectionRows = await prisma.scriptSection.findMany({
        where: { scriptId: id },
        orderBy: { order: "asc" },
      });
      const fullScriptText = assembleScriptText(
        script.chosenIntro ?? "",
        sectionRows.map((r) => ({ order: r.order, chosenText: r.chosenText })),
        hooks,
        null
      );
      const output = await generateCtasStage({
        chosenTitle: script.chosenTitle ?? "",
        fullScriptText,
        totalSections: sectionRows.length,
        clarifications,
      });
      if (output.status === "needs_input") {
        await prisma.script.update({
          where: { id },
          data: { pendingClarification: { phase: "CTAS", question: output.question } },
        });
      } else {
        await prisma.script.update({
          where: { id },
          data: { ctas: output.ctas as unknown as Prisma.InputJsonValue, currentPhase: "CTAS" },
        });
      }
    } else if (pending.phase === "STYLE_REVIEW") {
      if (!script.editedFinalScript) {
        throw new UserFacingError("Falta la versión final editada del guion.");
      }
      const hooks = script.transitionHooks as unknown as TransitionHookSet[] | null;
      const ctas = script.ctas as unknown as CtaItem[] | null;
      const sectionRows = await prisma.scriptSection.findMany({
        where: { scriptId: id },
        orderBy: { order: "asc" },
      });
      const generatedScriptText = assembleScriptText(
        script.chosenIntro ?? "",
        sectionRows.map((r) => ({ order: r.order, chosenText: r.chosenText })),
        hooks,
        ctas
      );
      const output = await generateStyleReviewStage({
        generatedScriptText,
        editedFinalScript: script.editedFinalScript,
        clarifications,
      });
      if (output.status === "needs_input") {
        await prisma.script.update({
          where: { id },
          data: { pendingClarification: { phase: "STYLE_REVIEW", question: output.question } },
        });
      } else {
        await prisma.script.update({
          where: { id },
          data: {
            styleGuideReport: output.report as unknown as Prisma.InputJsonValue,
            currentPhase: "COMPLETE",
          },
        });
      }
    } else {
      throw new UserFacingError("Esta etapa todavía no está implementada.");
    }
  }, "No se pudo reintentar la etapa. Probá de nuevo en un momento.");
  revalidatePath(`/guiones/${id}`);
}
