"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type CriterionId = "reliability" | "relevance" | "groundedness" | "intent";
export type Rating = 1 | 2 | 3 | 4 | 5;
export type Outcome = "supported" | "unsupported" | "insufficient_evidence";
export type ClaimVerdict = "supported" | "unsupported" | "insufficient_evidence";
export type RegressionCheck = { id: string; dimension: CriterionId; title: string; expectedBehavior: string };
type SignalStatus = "risk" | "review" | "topic-match";
type EvidenceSource = {
  id: string;
  title: string;
  meta: string;
  excerpt: string;
  kind: string;
  freshness?: string;
  updatedAt?: string;
  freshnessWindowDays?: number;
};

export const evidence: EvidenceSource[] = [
  {
    id: "1",
    title: "Card transaction ledger",
    meta: "Customer account · 14 May 2026",
    excerpt:
      "Two posted transactions to Northwind Air, S$84.20 each. Transaction IDs TX-4182 and TX-4183. No linked dispute ID.",
    kind: "SAMPLE SYSTEM RECORD",
    freshness: "Point-in-time record · 14 May 2026",
  },
  {
    id: "2",
    title: "Card disputes policy",
    meta: "Policy v3.2 · Updated 2 Oct 2026",
    excerpt:
      "After a cardholder files a duplicate-charge dispute, review may take up to 5 business days. A provisional credit may be issued after review; it is not guaranteed.",
    kind: "APPROVED SAMPLE POLICY",
    updatedAt: "2026-10-02",
    freshnessWindowDays: 90,
  },
];

export const criteria: {
  id: CriterionId;
  label: string;
  prompt: string;
  lowGuide: string;
  middleGuide: string;
  highGuide: string;
}[] = [
  {
    id: "reliability",
    label: "Reliability",
    prompt: "Are factual claims accurate and appropriately qualified?",
    lowGuide: "Material facts conflict with the records or promise an unsupported outcome.",
    middleGuide: "Some claims are plausible, but need closer checking or clearer qualification.",
    highGuide: "Material facts match the records and uncertainty is clearly qualified.",
  },
  {
    id: "relevance",
    label: "Relevance",
    prompt: "Does the answer address the customer’s actual question?",
    lowGuide: "It misses the main question or responds to a different need.",
    middleGuide: "It addresses the topic but leaves part of the request unanswered.",
    highGuide: "It responds to each important part of the customer’s request.",
  },
  {
    id: "groundedness",
    label: "Groundedness",
    prompt: "Can each material claim be verified in the cited evidence?",
    lowGuide: "Important claims are unsupported, contradicted, or cite missing sources.",
    middleGuide: "Some claims have sources, but support or freshness is uncertain.",
    highGuide: "Important claims are traceable to approved, relevant, current sources.",
  },
  {
    id: "intent",
    label: "Intent alignment",
    prompt: "Does it help with the request without overstepping?",
    lowGuide: "It makes an unauthorized commitment or skips a needed action.",
    middleGuide: "The next step or the agent’s authority is unclear.",
    highGuide: "It helps within the agent’s authority and gives a useful next step.",
  },
];

export const illustrativeTrendData = [
  { week: "Sep 08", reliability: 68, groundedness: 59, relevance: 82, intent: 70 },
  { week: "Sep 15", reliability: 72, groundedness: 63, relevance: 84, intent: 73 },
  { week: "Sep 22", reliability: 70, groundedness: 65, relevance: 85, intent: 75 },
  { week: "Sep 29", reliability: 77, groundedness: 69, relevance: 87, intent: 78 },
  { week: "Oct 06", reliability: 81, groundedness: 72, relevance: 89, intent: 80 },
  { week: "Oct 13", reliability: 84, groundedness: 76, relevance: 90, intent: 83 },
];

export const saferAnswer =
  "Your account shows two posted S$84.20 transactions to Northwind Air on 14 May [1]. The ledger does not establish whether they relate to the same booking [1]. The disputes policy says that after a duplicate-charge dispute is filed, review may take up to five business days; provisional credit is not guaranteed [2].";

export const initialAgentAnswer =
  "I confirmed the second charge is a duplicate [1]. You'll receive a refund tomorrow [2], and no action is needed.";

export type ClaimReview = {
  id: string;
  statement: string;
  verdict: ClaimVerdict;
  sourceIds: string[];
  explanation: string;
};

const initialClaimReviews: ClaimReview[] = [
  {
    id: "duplicate-confirmed",
    statement: "The second charge is a confirmed duplicate.",
    verdict: "insufficient_evidence",
    sourceIds: ["1"],
    explanation: "The ledger shows two payments, but does not link them to the same booking.",
  },
  {
    id: "refund-tomorrow",
    statement: "The refund will arrive tomorrow.",
    verdict: "unsupported",
    sourceIds: ["2"],
    explanation: "The policy describes a review period of up to five business days and does not guarantee provisional credit.",
  },
  {
    id: "no-action",
    statement: "No action is needed.",
    verdict: "unsupported",
    sourceIds: ["1", "2"],
    explanation: "The account has no linked dispute, and the policy timing applies after a dispute is filed.",
  },
];

const saferClaimReviews: ClaimReview[] = [
  {
    id: "transactions-recorded",
    statement: "Two S$84.20 transactions posted to Northwind Air on 14 May.",
    verdict: "supported",
    sourceIds: ["1"],
    explanation: "The transaction ledger lists both posted payments and their amounts.",
  },
  {
    id: "duplicate-unresolved",
    statement: "Whether the transactions relate to the same booking is unresolved.",
    verdict: "insufficient_evidence",
    sourceIds: ["1"],
    explanation: "The ledger contains no booking link that can establish whether they are duplicates.",
  },
  {
    id: "policy-review-period",
    statement: "A filed duplicate-charge dispute may take up to five business days to review.",
    verdict: "supported",
    sourceIds: ["2"],
    explanation: "This timing is stated in the sample card-disputes policy.",
  },
  {
    id: "provisional-credit",
    statement: "Provisional credit is not guaranteed.",
    verdict: "supported",
    sourceIds: ["2"],
    explanation: "The sample policy explicitly says provisional credit is not guaranteed.",
  },
];

export function getClaimReviews(answer: string): ClaimReview[] | null {
  if (answer === initialAgentAnswer) return initialClaimReviews;
  if (answer === saferAnswer) return saferClaimReviews;
  return null;
}

export function assessDraft(answer: string, request: string) {
  const citedIds = Array.from(answer.matchAll(/\[(\d+)\]/g), (match) => match[1]);
  const validCitations = citedIds.filter((id) => evidence.some((item) => item.id === id));
  const invalidCitations = citedIds.filter((id) => !evidence.some((item) => item.id === id));
  const answerText = answer.toLowerCase();
  const findings: { severity: "high" | "medium"; title: string; detail: string; dimension: CriterionId }[] = [];

  if (invalidCitations.length) {
    findings.push({
      severity: "high",
      title: "Citation not found",
      detail: `Reference${invalidCitations.length > 1 ? "s" : ""} [${Array.from(new Set(invalidCitations)).join("], [")}] do not match the evidence provided.`,
      dimension: "groundedness",
    });
  }

  if (/\b(tomorrow|today|immediately|within\s+\d+\s+hours?)\b/i.test(answer)) {
    findings.push({
      severity: "high",
      title: "Refund timing may overpromise",
      detail: "The cited policy says review may take up to 5 business days and provisional credit is not guaranteed; it does not support a refund tomorrow.",
      dimension: "reliability",
    });
  }

  if (/\bconfirmed\b/i.test(answer) && /duplicate/i.test(answer)) {
    findings.push({
      severity: "high",
      title: "Duplicate charge is not established",
      detail: "The ledger confirms two posted transactions, but does not confirm they relate to the same booking. It also shows no linked dispute ID.",
      dimension: "groundedness",
    });
  }

  if (/\bno action is needed\b|\bnothing you need to do\b/i.test(answer) && !/dispute (?:was|has been) filed/i.test(answerText)) {
    findings.push({
      severity: "medium",
      title: "Next step is unclear",
      detail: "The account record has no linked dispute, so the evidence does not support saying that no action is needed.",
      dimension: "intent",
    });
  }

  const sentences = (answer.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) ?? [])
    .map((part) => part.trim())
    .filter(Boolean);
  const uncited = sentences.filter((sentence) => !/\[\d+\]/.test(sentence));
  if (uncited.length) {
    findings.push({
      severity: "medium",
      title: "Some statements have no citation",
      detail: `${uncited.length} sentence${uncited.length === 1 ? "" : "s"} lack an evidence reference. Check them manually.`,
      dimension: "groundedness",
    });
  }

  const requestText = request.toLowerCase();
  const asksAboutDuplicate = /duplicate|same charge|same transaction|charged twice/.test(requestText);
  const asksAboutTiming = /when|how long|refund|money back|credit/.test(requestText);
  const coversDuplicate = /duplicate|same booking|same charge|charged twice/.test(answerText);
  const coversTiming = /refund|credit|business day|money back|return/.test(answerText);
  const missingTopics = [
    asksAboutDuplicate && !coversDuplicate ? "whether the charges are duplicates" : null,
    asksAboutTiming && !coversTiming ? "when the money may be returned" : null,
  ].filter(Boolean);
  const hasRiskFinding = (dimension: CriterionId) => findings.some((finding) => finding.dimension === dimension && finding.severity === "high");
  const hasIntentFinding = findings.some((finding) => finding.dimension === "intent");
  const hasGroundingFinding = findings.some((finding) => finding.dimension === "groundedness");
  const recognizedRequestFocus = asksAboutDuplicate || asksAboutTiming;

  const signals: Record<CriterionId, { status: SignalStatus; title: string; detail: string }> = {
    reliability: hasRiskFinding("reliability")
      ? { status: "risk", title: "Risk phrase detected", detail: "A configured check found a potentially unsupported promise. Verify all claims against the source records." }
      : { status: "review", title: "Human verification needed", detail: "No configured reliability phrase was found. This does not verify that the answer is factually correct." },
    relevance: missingTopics.length
      ? { status: "risk", title: "Request topic may be missing", detail: `The answer may not address ${missingTopics.join(" and ")}.` }
      : recognizedRequestFocus
        ? { status: "topic-match", title: "Request topics detected", detail: "The answer mentions the topics detected in this card-dispute request. This is phrase matching, not a relevance judgment." }
        : { status: "review", title: "Human relevance check", detail: "No supported request topic was detected by the demo rules. Judge the answer against the full request." },
    groundedness: hasGroundingFinding
      ? { status: "risk", title: "Evidence gap detected", detail: "A citation is missing, unknown, or attached to a claim that the provided record does not establish." }
      : { status: "review", title: "Verify claim support", detail: `${new Set(validCitations).size} attached source ID(s) are referenced. Matching IDs do not prove that a source supports a claim.` },
    intent: hasIntentFinding || hasRiskFinding("reliability")
      ? { status: "risk", title: "Possible overreach", detail: "The answer may promise an outcome or skip a next step that is not established by the case evidence." }
      : { status: "review", title: "Human intent check", detail: "Check that the answer responds to the customer without making unsupported commitments or taking unauthorized action." },
  };

  return { findings, signals, validCitationCount: new Set(validCitations).size, sentenceCount: sentences.length };
}

type Assessment = ReturnType<typeof assessDraft>;
type ReviewSession = {
  request: string;
  answer: string;
  ratings: Record<CriterionId, Rating | null>;
  regressionChecks: RegressionCheck[];
  assessment: Assessment | null;
  outcome: Outcome | null;
  showRewrite: boolean;
  ratingsComplete: boolean;
  setRequest: (value: string) => void;
  setAnswer: (value: string) => void;
  runChecks: () => void;
  updateRating: (id: CriterionId, rating: Rating) => void;
  addRegressionCheck: (check: RegressionCheck) => void;
  setShowRewrite: (value: boolean) => void;
  applySaferDraft: () => void;
  setOutcome: (value: Outcome | null) => void;
};

const ReviewSessionContext = createContext<ReviewSession | null>(null);

export function ReviewSessionProvider({ children }: { children: ReactNode }) {
  const [request, setRequestValue] = useState(
    "I see two S$84.20 charges to Northwind Air from 14 May. Are they duplicates, and when will I get the money back?"
  );
  const [answer, setAnswerValue] = useState(initialAgentAnswer);
  const [ratings, setRatings] = useState<Record<CriterionId, Rating | null>>({
    reliability: null,
    relevance: null,
    groundedness: null,
    intent: null,
  });
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [regressionChecks, setRegressionChecks] = useState<RegressionCheck[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [showRewrite, setShowRewrite] = useState(false);
  const ratingsComplete = Object.values(ratings).every(Boolean);

  function clearRatings() {
    setRatings({ reliability: null, relevance: null, groundedness: null, intent: null });
  }

  function updateRequest(value: string) {
    setRequestValue(value);
    setOutcome(null);
    clearRatings();
  }

  function updateAnswer(value: string) {
    setAnswerValue(value);
    setAssessment(null);
    setOutcome(null);
    setShowRewrite(false);
    clearRatings();
  }

  function runChecks() {
    setAssessment(assessDraft(answer, request));
    setOutcome(null);
  }

  function updateRating(id: CriterionId, rating: Rating) {
    setRatings((current) => ({ ...current, [id]: rating }));
    setOutcome(null);
  }

  function addRegressionCheck(check: RegressionCheck) {
    setRegressionChecks((current) =>
      current.some((item) => item.id === check.id) ? current : [...current, check]
    );
  }

  function applySaferDraft() {
    updateAnswer(saferAnswer);
  }

  return (
    <ReviewSessionContext.Provider
      value={{
        request,
        answer,
        ratings,
        regressionChecks,
        assessment,
        outcome,
        showRewrite,
        ratingsComplete,
        setRequest: updateRequest,
        setAnswer: updateAnswer,
        runChecks,
        updateRating,
        addRegressionCheck,
        setShowRewrite,
        applySaferDraft,
        setOutcome,
      }}
    >
      {children}
    </ReviewSessionContext.Provider>
  );
}

export function useReviewSession() {
  const session = useContext(ReviewSessionContext);
  if (!session) throw new Error("ReviewSessionProvider is missing from the app layout");
  return session;
}
