"use client";

import type { ScriptPhase } from "@prisma/client";
import type {
  CtaItem,
  IntroVariation,
  OutlineSection,
  PayoffItem,
  StyleGuideReport,
  TitleAssessment,
  TitleCandidate,
  TransitionHookSet,
} from "@/lib/scripts/types";
import { SCRIPT_PHASE_LABEL } from "../phaseLabels";
import { TitleStage } from "./TitleStage";
import { IntroStage } from "./IntroStage";
import { OutlineStage } from "./OutlineStage";
import { PayoffsStage } from "./PayoffsStage";
import { SectionsStage, type SectionRow } from "./SectionsStage";
import { TransitionsStage } from "./TransitionsStage";
import { CtasStage } from "./CtasStage";
import { StyleReviewStage } from "./StyleReviewStage";
import { CompleteView } from "./CompleteView";
import { ClarificationCard } from "./ClarificationCard";

export interface ClarificationRow {
  id: string;
  phase: ScriptPhase;
  question: string;
  answer: string;
}

export interface ScriptWizardProps {
  id: string;
  currentPhase: ScriptPhase;
  pendingClarification: {
    phase: "TITLE" | "INTRO" | "OUTLINE" | "PAYOFFS" | "TRANSITIONS" | "CTAS" | "STYLE_REVIEW";
    question: string;
  } | null;
  research: string;
  referenceScript: string | null;
  thumbnailDescription: string;
  titleMode: "VALIDATE" | "GENERATE";
  title: string | null;
  titleAssessment: TitleAssessment | null;
  titleCandidates: TitleCandidate[] | null;
  chosenTitle: string | null;
  introVariations: IntroVariation[] | null;
  chosenIntroAngle: string | null;
  chosenIntro: string | null;
  brainDump: string | null;
  outlineSections: OutlineSection[] | null;
  payoffs: PayoffItem[] | null;
  sections: SectionRow[];
  transitionHooks: TransitionHookSet[] | null;
  ctas: CtaItem[] | null;
  editedFinalScript: string | null;
  styleGuideReport: StyleGuideReport | null;
  notes: string | null;
  clarifications: ClarificationRow[];
}

export function ScriptWizard(props: ScriptWizardProps) {
  const activePhase = props.pendingClarification?.phase ?? props.currentPhase;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <details className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-300">
          Investigación, referencia y miniatura
        </summary>
        <div className="mt-3 flex flex-col gap-3 text-xs text-neutral-400">
          <div>
            <p className="mb-1 text-neutral-300">Descripción de la miniatura</p>
            <p>{props.thumbnailDescription}</p>
          </div>
          <div>
            <p className="mb-1 text-neutral-300">Investigación</p>
            <p className="whitespace-pre-wrap">{props.research}</p>
          </div>
          <div>
            <p className="mb-1 text-neutral-300">Guion de referencia</p>
            <p className="whitespace-pre-wrap">{props.referenceScript ?? "No se proporcionó."}</p>
          </div>
        </div>
      </details>

      {props.clarifications.length > 0 && (
        <details className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
          <summary className="cursor-pointer text-sm font-medium text-neutral-300">
            Aclaraciones ({props.clarifications.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2 text-xs text-neutral-400">
            {props.clarifications.map((c) => (
              <li key={c.id} className="rounded-md border border-neutral-800 p-2">
                <p className="text-neutral-300">
                  [{SCRIPT_PHASE_LABEL[c.phase]}] {c.question}
                </p>
                <p className="mt-1">{c.answer}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {props.pendingClarification ? (
        <ClarificationCard id={props.id} question={props.pendingClarification.question} />
      ) : activePhase === "TITLE" ? (
        <TitleStage
          id={props.id}
          titleMode={props.titleMode}
          titleAssessment={props.titleAssessment}
          titleCandidates={props.titleCandidates}
          chosenTitle={props.chosenTitle}
          title={props.title}
        />
      ) : activePhase === "INTRO" ? (
        <IntroStage
          id={props.id}
          introVariations={props.introVariations}
          chosenIntroAngle={props.chosenIntroAngle}
          chosenIntro={props.chosenIntro}
        />
      ) : activePhase === "OUTLINE" ? (
        <OutlineStage
          id={props.id}
          outlineSections={props.outlineSections}
          brainDump={props.brainDump}
          notes={props.notes}
        />
      ) : activePhase === "PAYOFFS" ? (
        <PayoffsStage id={props.id} outlineSections={props.outlineSections} payoffs={props.payoffs} />
      ) : activePhase === "SECTIONS" ? (
        <SectionsStage
          id={props.id}
          outlineSections={props.outlineSections}
          sections={props.sections}
        />
      ) : activePhase === "TRANSITIONS" ? (
        <TransitionsStage
          id={props.id}
          outlineSections={props.outlineSections}
          transitionHooks={props.transitionHooks}
        />
      ) : activePhase === "CTAS" ? (
        <CtasStage id={props.id} ctas={props.ctas} />
      ) : activePhase === "STYLE_REVIEW" ? (
        <StyleReviewStage id={props.id} editedFinalScript={props.editedFinalScript} />
      ) : activePhase === "COMPLETE" ? (
        <CompleteView
          chosenIntro={props.chosenIntro}
          outlineSections={props.outlineSections}
          sections={props.sections}
          transitionHooks={props.transitionHooks}
          ctas={props.ctas}
          styleGuideReport={props.styleGuideReport}
        />
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-400">
          {SCRIPT_PHASE_LABEL[activePhase]}: próximamente.
        </div>
      )}
    </div>
  );
}
