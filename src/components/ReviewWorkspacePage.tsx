"use client";

import Link from "next/link";
import { criteria, evidence, getClaimReviews, illustrativeTrendData, saferAnswer, useReviewSession, type CriterionId, type Outcome, type Rating } from "./ReviewSessionProvider";

type ReviewPage = "review" | "sources" | "rubric" | "trends" | "improvements";

const pageDetails: Record<ReviewPage, { title: string; copy: string; breadcrumb: string }> = {
  review: {
    title: "Review an answer",
    copy: "Check the answer against the customer’s request and sources.",
    breadcrumb: "Answer review",
  },
  rubric: {
    title: "Evaluate the answer",
    copy: "Rate each dimension, then record your decision.",
    breadcrumb: "Evaluation rubric",
  },
  sources: {
    title: "Inspect the evidence",
    copy: "Check what the records and policy actually support.",
    breadcrumb: "Evidence sources",
  },
  trends: {
    title: "Reliability trends",
    copy: "Weekly pass rates across four review dimensions.",
    breadcrumb: "Admin trends",
  },
  improvements: {
    title: "Recommended improvements",
    copy: "Suggested changes based on this case’s screening flags.",
    breadcrumb: "System recommendations",
  },
};

const trendMetrics: { id: CriterionId; label: string; color: string }[] = [
  { id: "reliability", label: "Reliability", color: "#c91928" },
  { id: "groundedness", label: "Groundedness", color: "#287b67" },
  { id: "relevance", label: "Relevance", color: "#386da8" },
  { id: "intent", label: "Intent alignment", color: "#ae751d" },
];

function RatingControl({
  value,
  onChange,
}: {
  value: Rating | null;
  onChange: (rating: Rating) => void;
}) {
  return (
    <div className="rating-control" role="group" aria-label="Reviewer rating">
      {([1, 2, 3, 4, 5] as const).map((rating) => (
        <button
          key={rating}
          type="button"
          aria-pressed={value === rating}
          aria-label={`${rating} out of 5`}
          className={`rating-option${value === rating ? " selected" : ""}`}
          onClick={() => onChange(rating)}
        >
          {rating}
        </button>
      ))}
    </div>
  );
}

function EvidenceList() {
  const freshnessStatus = (updatedAt: string, windowDays: number) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000));
    return {
      days,
      withinWindow: days <= windowDays,
    };
  };

  return (
    <div className="evidence-list">
      {evidence.map((item) => (
        <article className="evidence-item" key={item.id}>
          <div className="source-number">[{item.id}]</div>
          <div className="source-content">
            <div className="source-title-row"><h3>{item.title}</h3><span>{item.kind}</span></div>
            <p className="source-meta">{item.meta}</p>
            <p className="source-excerpt">“{item.excerpt}”</p>
            {item.updatedAt && item.freshnessWindowDays ? (
              <p className={`source-freshness ${freshnessStatus(item.updatedAt, item.freshnessWindowDays).withinWindow ? "freshness-current" : "freshness-review"}`}>
                <span />
                {freshnessStatus(item.updatedAt, item.freshnessWindowDays).withinWindow
                  ? `Within demo ${item.freshnessWindowDays}-day review window · updated ${freshnessStatus(item.updatedAt, item.freshnessWindowDays).days} days ago`
                  : `Review freshness · updated ${freshnessStatus(item.updatedAt, item.freshnessWindowDays).days} days ago`}
              </p>
            ) : (
              <p className="source-freshness freshness-context"><span />{item.freshness}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function TrendsOverview() {
  const firstPeriod = illustrativeTrendData[0];
  const latestPeriod = illustrativeTrendData[illustrativeTrendData.length - 1];

  return (
    <div className="insights-layout">
      <section className="work-panel trend-panel">
        <div className="panel-heading">
          <div><span className="section-index">ADMIN</span><h2>Evaluation performance</h2></div>
          <span className="evidence-count">6 sample periods</span>
        </div>
        <div className="trend-metric-grid">
          {trendMetrics.map((metric) => (
            <article className="trend-metric" key={metric.id}>
              <span>{metric.label}</span>
              <strong>{latestPeriod[metric.id]}%</strong>
              <small>{latestPeriod[metric.id] - firstPeriod[metric.id] >= 0 ? "+" : ""}{latestPeriod[metric.id] - firstPeriod[metric.id]} pts across sample</small>
            </article>
          ))}
        </div>
        <div className="trend-chart" role="img" aria-label="Illustrative six-period pass-rate trend across reliability, groundedness, relevance, and intent alignment">
          <div className="trend-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
          <div className="trend-periods">
            {illustrativeTrendData.map((period) => (
              <div className="trend-period" key={period.week}>
                <div className="trend-bars">
                  {trendMetrics.map((metric) => (
                    <span
                      key={metric.id}
                      className="trend-bar"
                      style={{ height: `${period[metric.id]}%`, backgroundColor: metric.color }}
                      title={`${metric.label}: ${period[metric.id]}%`}
                    />
                  ))}
                </div>
                <span className="trend-date">{period.week}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="trend-legend">
          {trendMetrics.map((metric) => <span key={metric.id}><i style={{ backgroundColor: metric.color }} />{metric.label}</span>)}
        </div>
        <p className="prototype-note trend-disclaimer"><strong>Demo data:</strong> these values are illustrative synthetic benchmark results, not live Orbit reviews or OCBC data.</p>
      </section>
      <aside className="assessment-column">
        <section className="decision-panel">
          <div className="decision-heading"><h2>Administrator view</h2><span>DEMO</span></div>
          <p>Use trends to decide where to focus review and which agent behaviors need further testing.</p>
          <div className="trend-callout"><strong>Groundedness is the lowest sample measure</strong><span>Prioritize claim-to-source verification tests.</span></div>
          <Link className="route-next-panel" href="/improvements">View system recommendations <span>→</span></Link>
        </section>
      </aside>
    </div>
  );
}

function ImprovementRecommendations() {
  const { assessment, regressionChecks, addRegressionCheck } = useReviewSession();
  const signals = assessment?.signals;
  const suggestions = [
    {
      dimension: "Reliability",
      criterion: "reliability" as const,
      active: signals?.reliability.status === "risk",
      trigger: "The answer promises a refund tomorrow, but the policy only describes a review period and says credit is not guaranteed.",
      recommendation: "Ground all refund timing in the current approved policy. Do not promise an exact date unless a verified source explicitly supports it.",
      owner: "Agent prompt and policy retrieval",
    },
    {
      dimension: "Groundedness",
      criterion: "groundedness" as const,
      active: signals?.groundedness.status === "risk",
      trigger: "The answer calls the transactions duplicates, but the ledger only confirms that two payments posted.",
      recommendation: "Require claim-level evidence checks. Treat two similar transactions as a possible duplicate, not a confirmed duplicate, unless a source links them.",
      owner: "Evidence validation step",
    },
    {
      dimension: "Intent alignment",
      criterion: "intent" as const,
      active: signals?.intent.status === "risk",
      trigger: "The answer says no action is needed even though the case has no linked dispute.",
      recommendation: "Check case status before advising the customer. When status is unknown, explain the uncertainty and offer only an approved next step.",
      owner: "Tool-use and response policy",
    },
    {
      dimension: "Relevance",
      criterion: "relevance" as const,
      active: signals?.relevance.status === "risk",
      trigger: "The answer appears to omit part of the customer’s request.",
      recommendation: "Extract each question in the request and verify that the final response addresses every part before returning it.",
      owner: "Response completeness check",
    },
  ].filter((suggestion) => suggestion.active);

  return (
    <div className="improvements-layout">
      <section className="work-panel improvements-panel">
        <div className="panel-heading">
          <div><span className="section-index">SYSTEM</span><h2>Suggested agent changes</h2></div>
          <span className="evidence-count">{assessment ? `${suggestions.length} case-based` : "Awaiting checks"}</span>
        </div>
        {!assessment ? (
          <div className="empty-guidance"><p>Run screening checks on the Review page first. Orbit will turn detected case risks into suggestions for the agent team.</p><Link className="route-next-panel" href="/">Go to answer review <span>→</span></Link></div>
        ) : suggestions.length ? (
          <div className="recommendation-list">
            {suggestions.map((suggestion) => (
              <article className="recommendation" key={suggestion.dimension}>
                <div className="recommendation-top"><span>{suggestion.dimension}</span><small>PROPOSED CHANGE</small></div>
                <p className="recommendation-trigger"><strong>Observed risk:</strong> {suggestion.trigger}</p>
                <p className="recommendation-copy">{suggestion.recommendation}</p>
                <div className="recommendation-owner"><span>Suggested control</span><strong>{suggestion.owner}</strong></div>
                <button
                  type="button"
                  className="regression-add-button"
                  disabled={regressionChecks.some((check) => check.id === `${suggestion.criterion}:${suggestion.dimension}`)}
                  onClick={() => addRegressionCheck({
                    id: `${suggestion.criterion}:${suggestion.dimension}`,
                    dimension: suggestion.criterion,
                    title: suggestion.trigger,
                    expectedBehavior: suggestion.recommendation,
                  })}
                >
                  {regressionChecks.some((check) => check.id === `${suggestion.criterion}:${suggestion.dimension}`) ? "Added to test set" : "Add regression check"}
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="signal-empty">No configured risks were detected in this answer. That does not prove correctness; continue with human review and broader benchmark testing.</p>
        )}
      </section>
      <aside className="assessment-column">
        <section className="decision-panel">
          <div className="decision-heading"><h2>How recommendations work</h2><span>RULE-BASED</span></div>
          <p>Each suggestion is linked to a screening signal from this case. It is a proposal for the agent team, not an automatic prompt or model change.</p>
          <Link className="route-next-panel" href="/rubric">Review this case with the rubric <span>→</span></Link>
        </section>
        <section className="decision-panel regression-set-panel">
          <div className="decision-heading"><h2>Regression test set</h2><span>{regressionChecks.length} QUEUED</span></div>
          <p>Checks queued from this review session. They are not run automatically.</p>
          {regressionChecks.length > 0 && (
            <ul>
              {regressionChecks.map((check) => <li key={check.id}><strong>{check.dimension}</strong><span>{check.expectedBehavior}</span></li>)}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

function SignalSummary() {
  const { assessment } = useReviewSession();

  if (!assessment) {
    return <p className="signal-empty">Run checks on the Review page to see advisory signals for this answer.</p>;
  }

  return (
    <div className="signal-grid">
      {criteria.map((criterion) => {
        const signal = assessment.signals[criterion.id];
        const relatedFindings = assessment.findings.filter((finding) => finding.dimension === criterion.id);
        const statusLabel = signal.status === "risk" ? "Flag raised" : signal.status === "topic-match" ? "Topic match" : "Human check";
        return (
          <article className={`signal-card signal-${signal.status}`} key={criterion.id}>
            <div className="signal-card-heading"><h3>{criterion.label}</h3><span>{statusLabel}</span></div>
            {relatedFindings.length ? (
              relatedFindings.map((finding) => (
                <div className="signal-finding" key={finding.title}>
                  <strong>{finding.title}</strong>
                  <p>{finding.detail}</p>
                </div>
              ))
            ) : (
              <div className="signal-finding"><strong>{signal.title}</strong><p>{signal.detail}</p></div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function Findings() {
  const { assessment, showRewrite, setShowRewrite, applySaferDraft } = useReviewSession();
  if (!assessment) return null;

  return (
    <section className="findings-panel" aria-live="polite">
      <div className="findings-heading">
        <div><span className="findings-icon">!</span><div><h2>Screening signals</h2><p>Rule-based checks · reviewer must verify</p></div></div>
        <span className="citation-count">{assessment.validCitationCount} source IDs referenced</span>
      </div>
      <SignalSummary />
      {!assessment.findings.length && (
        <p className="no-findings">No configured screening flags were triggered. This does not establish that the answer is correct; review the source material.</p>
      )}
      <button type="button" className="rewrite-button" onClick={() => setShowRewrite(!showRewrite)}>
        {showRewrite ? "Hide safer draft" : "View evidence-bounded draft"}<span>→</span>
      </button>
      {showRewrite && (
        <div className="rewrite-preview">
          <div className="rewrite-label">SUGGESTED REVISION · DEMO TEMPLATE</div>
          <p>{saferAnswer}</p>
          <button type="button" onClick={applySaferDraft}>Use this draft</button>
        </div>
      )}
    </section>
  );
}

function ClaimAuditPanel() {
  const { answer } = useReviewSession();
  const claimReviews = getClaimReviews(answer);

  return (
    <section className="work-panel claim-audit-panel">
      <div className="panel-heading">
        <div><span className="section-index">CLAIMS</span><h2>Claim evidence ledger</h2></div>
        <span className="panel-source">CURATED DEMO REVIEW</span>
      </div>
      {claimReviews ? (
        <div className="claim-list">
          {claimReviews.map((claim) => (
            <article className="claim-row" key={claim.id}>
              <div className="claim-main">
                <strong>{claim.statement}</strong>
                <p>{claim.explanation}</p>
                <div className="claim-source-links">
                  {claim.sourceIds.map((sourceId) => {
                    const source = evidence.find((item) => item.id === sourceId);
                    return source ? <Link href="/sources" key={sourceId}>[{sourceId}] {source.title}</Link> : null;
                  })}
                </div>
              </div>
              <span className={`claim-verdict claim-${claim.verdict}`}>
                {claim.verdict === "insufficient_evidence" ? "Insufficient evidence" : claim.verdict === "supported" ? "Supported" : "Unsupported"}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="claim-ledger-note">Claim-level mapping is prepared for the two supplied sample answers. For edited answers, use the rubric and inspect each source manually; the prototype does not extract claims automatically.</p>
      )}
    </section>
  );
}

function RubricPanel() {
  const { ratings, ratingsComplete, updateRating } = useReviewSession();
  return (
    <section className="rubric-panel">
      <div className="rubric-heading">
        <div><p className="eyebrow">HUMAN REVIEW</p><h2>Evaluation rubric</h2></div>
        <span className="rubric-progress">{Object.values(ratings).filter(Boolean).length}/4</span>
      </div>
      <p className="rubric-intro">Rate each dimension using the evidence and the customer’s request.</p>
      <div className="criteria-list">
        {criteria.map((criterion, index) => (
          <div className="criterion" key={criterion.id}>
            <div className="criterion-title">
              <span className="criterion-number">0{index + 1}</span>
              <h3>{criterion.label}</h3>
              {ratings[criterion.id] && <span className={`rating-indicator indicator-${ratings[criterion.id]}`} />}
            </div>
            <p>{criterion.prompt}</p>
            <RatingControl value={ratings[criterion.id]} onChange={(rating) => updateRating(criterion.id as CriterionId, rating)} />
            <details className="rating-guide">
              <summary>Scoring guide</summary>
              <dl>
                <div><dt>1–2</dt><dd>{criterion.lowGuide}</dd></div>
                <div><dt>3</dt><dd>{criterion.middleGuide}</dd></div>
                <div><dt>4–5</dt><dd>{criterion.highGuide}</dd></div>
              </dl>
            </details>
          </div>
        ))}
      </div>
      {!ratingsComplete && <p className="rubric-hint">Rate all four dimensions before recording a decision.</p>}
    </section>
  );
}

function DecisionPanel() {
  const { ratingsComplete, outcome, setOutcome } = useReviewSession();
  const verdicts: { id: Outcome; title: string; detail: string }[] = [
    { id: "supported", title: "Supported", detail: "The evidence supports the material claims." },
    { id: "unsupported", title: "Unsupported", detail: "Evidence contradicts or does not support a claim." },
    { id: "insufficient_evidence", title: "Insufficient evidence", detail: "The available sources cannot establish the answer." },
  ];

  return (
    <section className="decision-panel">
      <div className="decision-heading"><h2>Evidence verdict</h2><span>REQUIRED</span></div>
      <p>What does the evidence say about the answer?</p>
      <div className="decision-actions">
        {verdicts.map((verdict) => (
          <button
            key={verdict.id}
            type="button"
            className={`verdict-button${outcome === verdict.id ? " chosen" : ""}`}
            disabled={!ratingsComplete}
            aria-pressed={outcome === verdict.id}
            onClick={() => setOutcome(verdict.id)}
          >
            <span><strong>{verdict.title}</strong><small>{verdict.detail}</small></span>
          </button>
        ))}
      </div>
      {outcome && (
        <div className="decision-confirmation" role="status">
          <span>✓</span>Verdict recorded for this review session:
          <strong>{outcome === "insufficient_evidence" ? "Insufficient evidence" : outcome === "supported" ? "Supported" : "Unsupported"}</strong>
        </div>
      )}
    </section>
  );
}

export function ReviewWorkspacePage({ page }: { page: ReviewPage }) {
  const { request, answer, ratings, assessment, setRequest, setAnswer, runChecks } = useReviewSession();
  const detail = pageDetails[page];
  const referencedIds = new Set(Array.from(answer.matchAll(/\[(\d+)\]/g), (match) => match[1]));

  return (
    <main className="review-workspace">
      <aside className="review-sidebar">
        <Link className="review-brand" href="/" aria-label="Orbit answer review home">
          <span className="brand-mark" aria-hidden="true" />
          <span>Orbit<span className="brand-period">.</span></span>
        </Link>
        <div className="workspace-label">AI ANSWER ASSURANCE</div>
        <nav className="review-nav" aria-label="Main navigation">
          <Link className={`nav-item${page === "review" ? " nav-active" : ""}`} href="/"><span className="nav-icon">01</span>Review</Link>
          <Link className={`nav-item${page === "sources" ? " nav-active" : ""}`} href="/sources"><span className="nav-icon">02</span>Sources</Link>
          <Link className={`nav-item${page === "rubric" ? " nav-active" : ""}`} href="/rubric"><span className="nav-icon">03</span>Rubric</Link>
        </nav>
        <div className="insights-nav">
          <span className="insights-label">INSIGHTS</span>
          <Link className={`insight-link${page === "trends" ? " insight-active" : ""}`} href="/trends">Trends</Link>
          <Link className={`insight-link${page === "improvements" ? " insight-active" : ""}`} href="/improvements">Improve</Link>
        </div>
        <div className="sidebar-bottom">
          <div className="guardrail-note"><span className="guardrail-dot" />Reviewer-led decisions</div>
          <div className="reviewer-profile"><span className="reviewer-avatar">DR</span><span><strong>Demo reviewer</strong><small>AI quality review</small></span></div>
        </div>
      </aside>

      <section className="review-main">
        <header className="review-topbar">
          <div className="breadcrumbs">Quality assurance <span>/</span> {detail.breadcrumb}</div>
          <div className="topbar-right"><span className="environment-label"><span />DEMO WORKSPACE</span></div>
        </header>

        <div className="review-content">
          <div className="page-heading">
            <div>
              <h1>{detail.title}</h1>
              <p className="heading-copy">{detail.copy}</p>
            </div>
          </div>

          <div className="case-meta-row">
            <span className="case-tag">{page === "trends" ? "SYNTHETIC DATA" : page === "improvements" ? "CASE CS-2048" : "CASE CS-2048"}</span>
            {page !== "trends" && <span>{page === "improvements" ? "Card Support · v2.8.1" : "Card Support Agent · v2.8.1"}</span>}
            {page === "trends" && <span>6 illustrative periods</span>}
            <span className="case-status"><span />{page === "trends" ? "Illustrative benchmark" : page === "improvements" ? "Recommendations" : page === "rubric" && Object.values(ratings).every(Boolean) ? "Ready for decision" : "Awaiting review"}</span>
          </div>

          {page === "review" && (
            <div className="review-grid">
              <div className="review-column">
                <section className="work-panel request-panel">
                  <div className="panel-heading"><div><span className="section-index">01</span><h2>Customer request</h2></div><span className="panel-source">INBOUND MESSAGE</span></div>
                  <textarea aria-label="Customer request" value={request} onChange={(event) => setRequest(event.target.value)} rows={3} />
                </section>
                <section className="work-panel answer-panel">
                  <div className="panel-heading"><div><span className="section-index">02</span><h2>Agent answer</h2></div><span className="model-tag"><span />GENERATED · CARD SUPPORT V2</span></div>
                  <textarea aria-label="Agent answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} />
                  <div className="answer-footer"><div className="answer-info"><span>References use <strong>[source number]</strong></span><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span></div><button type="button" className="run-checks" onClick={runChecks}><span>◎</span>Run checks</button></div>
                </section>
                <ClaimAuditPanel />
                <Findings />
              </div>
              <aside className="assessment-column">
                <section className="decision-panel">
                  <div className="decision-heading"><h2>Review steps</h2><span>1 OF 3</span></div>
                  <p>Move through this case in order. Your work stays with the case as you navigate.</p>
                  <Link className="step-link" href="/sources"><span>02</span><span><strong>Inspect evidence</strong><small>{evidence.length} attached sources</small></span><b>→</b></Link>
                  <Link className="step-link" href="/rubric"><span>03</span><span><strong>Rate and decide</strong><small>{Object.values(ratings).filter(Boolean).length}/4 ratings complete</small></span><b>→</b></Link>
                </section>
              </aside>
            </div>
          )}

          {page === "rubric" && (
            <div className="review-grid rubric-page-grid">
              <RubricPanel />
              <aside className="assessment-column">
                <section className="decision-panel rubric-signals-panel">
                  <div className="decision-heading"><h2>Screening signals</h2><span>ADVISORY</span></div>
                  <p>Use these rule-based cues alongside your own review; they are not validated scores.</p>
                  <SignalSummary />
                  <Link className="inline-route-link" href="/">Back to answer review <span>→</span></Link>
                </section>
                <DecisionPanel />
              </aside>
            </div>
          )}

          {page === "sources" && (
            <div className="review-grid sources-page-grid">
              <section className="work-panel evidence-panel" id="evidence">
                <div className="panel-heading"><div><span className="section-index">02</span><h2>Evidence provided</h2><span className="evidence-count">{evidence.length} attached</span></div></div>
                <EvidenceList />
              </section>
              <aside className="assessment-column">
                <section className="decision-panel source-review-panel">
                  <div className="decision-heading"><h2>Source coverage</h2><span>{referencedIds.size} USED</span></div>
                  <p>References present in the agent answer. A matching source ID does not prove that the source supports the claim.</p>
                  {evidence.map((item) => (
                    <div className="source-coverage-row" key={item.id}><span className={referencedIds.has(item.id) ? "coverage-used" : "coverage-unused"}>{referencedIds.has(item.id) ? "✓" : "–"}</span><span>[{item.id}] {item.title}</span><strong>{referencedIds.has(item.id) ? "Cited" : "Not cited"}</strong></div>
                  ))}
                </section>
              </aside>
            </div>
          )}

          {page === "trends" && <TrendsOverview />}

          {page === "improvements" && <ImprovementRecommendations />}

          <footer className="review-footer">
            {page === "rubric" && <Link className="page-step-button" href="/sources">← Back to sources</Link>}
            {page === "sources" && <><Link className="page-step-button" href="/">← Back to answer</Link><Link className="page-step-button page-step-next" href="/rubric">Next: rate and decide <span>→</span></Link></>}
            {page === "trends" && <Link className="page-step-button page-step-next" href="/improvements">View agent improvements <span>→</span></Link>}
            {page === "improvements" && <Link className="page-step-button" href="/trends">← Back to trends</Link>}
            <p><strong>Demo:</strong> screening cues are rule-based and advisory; reviewers make the final decision.</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
