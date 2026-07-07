import { describe, expect, it } from "vitest";
import { isLikelyFictional, isLikelyListicle } from "./contentFilter";

describe("isLikelyFictional", () => {
  it("flags creepypasta-style titles", () => {
    expect(isLikelyFictional("Scary Creepypasta Story")).toBe(true);
  });

  it("does not flag a real case title", () => {
    expect(isLikelyFictional("The Disappearance of Jane Doe")).toBe(false);
  });
});

describe("isLikelyListicle", () => {
  it("flags English top-N titles", () => {
    expect(isLikelyListicle("Top 10 Scariest Unsolved Cases")).toBe(true);
  });

  it("flags English superlative-count titles", () => {
    expect(isLikelyListicle("15 Craziest True Crime Stories")).toBe(true);
  });

  it("flags ranking/ranked titles", () => {
    expect(isLikelyListicle("Serial Killers Ranked")).toBe(true);
  });

  it("flags Spanish 'los/las N' titles", () => {
    expect(isLikelyListicle("Las 10 Mujeres Asesinas Más Crueles")).toBe(true);
  });

  it("flags Spanish numbered-case titles", () => {
    expect(isLikelyListicle("15 Historias de True Crime")).toBe(true);
  });

  it("flags Spanish superlative titles", () => {
    expect(isLikelyListicle("Los Asesinos Más Peligrosos del Mundo")).toBe(true);
  });

  it("does not flag a single-case narrative title", () => {
    expect(isLikelyListicle("The Murder of Elisa Lam: A Case Breakdown")).toBe(false);
  });

  it("does not flag a Spanish single-case narrative title", () => {
    expect(isLikelyListicle("El Caso de Elisa Lam: Análisis Completo")).toBe(false);
  });

  it("flags leading-count titles regardless of the following word", () => {
    expect(isLikelyListicle("22 DEADLY Women Who Will NEVER Leave Prison (Part 8)")).toBe(true);
    expect(isLikelyListicle("9 WEIRD And BIZARRE People In HISTORY | Freak Show Legends")).toBe(true);
    expect(isLikelyListicle("5 PET ATTACKS That Shocked The World")).toBe(true);
    expect(isLikelyListicle("18 Women EXECUTED in Public: What They Said Before They Died")).toBe(true);
  });

  it("does not flag a title starting with a 4-digit year", () => {
    expect(isLikelyListicle("1996: The Zodiac Killer Returns")).toBe(false);
  });

  it("does not flag a 911 call title (emergency number, not a count)", () => {
    expect(isLikelyListicle("911 Call RESCUES Woman From Her Neighbor From Hell!")).toBe(false);
  });
});
