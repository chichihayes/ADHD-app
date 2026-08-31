"use client";

import { useEffect, useRef, useState } from "react";
import {
  EXPLANATION_SYSTEM_PROMPT,
  FEEDBACK_SYSTEM_PROMPT,
  feedbackUserPrompt,
  storySystemPrompt,
  storyUserPrompt,
  questionSystemPrompt,
  questionUserPrompt,
  answerEvalSystemPrompt,
  answerEvalUserPrompt,
  nextStageSystemPrompt,
  nextStageUserPrompt,
} from "@/src/lib/prompts";

type Entry = { role: "user" | "ai"; label: string; text: string; special?: boolean; pending?: boolean; error?: boolean };
type HistoryMsg = { role: "user" | "assistant"; content: string };
type Stage = "question" | "feedback" | "interest" | "questionPhase" | "answer";
type Tab = "about" | "learn" | "visualize";

async function callAI(systemPrompt: string, userPrompt: string, history: HistoryMsg[]) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userPrompt, history }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { text: `Oops! I'm having trouble thinking right now. Can you try again? 🤔 (Error: ${data.error || res.status})`, error: true };
  }
  return { text: data.response as string, error: false };
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("about");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [history, setHistory] = useState<HistoryMsg[]>([]);
  const [stage, setStage] = useState<Stage>("question");
  const [currentTopic, setCurrentTopic] = useState("");
  const [childInterest, setChildInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const questionPhaseFired = useRef(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  function pushHistory(userPrompt: string, aiResponse: string) {
    setHistory((h) => [...h, { role: "user", content: userPrompt }, { role: "assistant", content: aiResponse }]);
  }
  function push(entry: Entry) {
    setEntries((e) => [...e, entry]);
  }

  async function handleQuestionSubmit(userInput: string) {
    push({ role: "user", label: "Your question", text: userInput });
    setCurrentTopic(userInput);
    setLoading(true);
    const { text: aiResponse } = await callAI(EXPLANATION_SYSTEM_PROMPT, userInput, history);
    pushHistory(userInput, aiResponse);
    push({ role: "ai", label: "Explanation", text: aiResponse });
    setLoading(false);
    setStage("feedback");
  }

  async function handleFeedbackSubmit(feedbackText: string) {
    push({ role: "user", label: "Your understanding", text: feedbackText });
    setLoading(true);
    const prompt = feedbackUserPrompt(feedbackText);
    const { text: aiReview } = await callAI(FEEDBACK_SYSTEM_PROMPT, prompt, history);
    pushHistory(prompt, aiReview);
    push({ role: "ai", label: "Feedback", text: aiReview });
    setLoading(false);
    setStage("interest");
  }

  async function handleInterestSubmit(interestText: string) {
    push({ role: "user", label: "Your interest", text: interestText });
    setChildInterest(interestText);
    setLoading(true);
    const sys = storySystemPrompt(interestText, currentTopic);
    const prompt = storyUserPrompt(currentTopic, interestText);
    const { text: aiStory } = await callAI(sys, prompt, history);
    pushHistory(prompt, aiStory);
    push({ role: "ai", label: "In context", text: aiStory, special: true });
    setLoading(false);
    setStage("questionPhase");
  }

  async function handleAnswerSubmit(answerText: string) {
    push({ role: "user", label: "Your answer", text: answerText });
    setLoading(true);

    const evalSys = answerEvalSystemPrompt(currentTopic, childInterest);
    const evalPrompt = answerEvalUserPrompt(answerText);
    const { text: evalResponse } = await callAI(evalSys, evalPrompt, history);
    pushHistory(evalPrompt, evalResponse);
    push({ role: "ai", label: "Evaluation", text: evalResponse });

    const nextSys = nextStageSystemPrompt(childInterest);
    const nextPrompt = nextStageUserPrompt(currentTopic, childInterest);
    const { text: nextResponse } = await callAI(nextSys, nextPrompt, [
      ...history,
      { role: "user", content: evalPrompt },
      { role: "assistant", content: evalResponse },
    ]);
    pushHistory(nextPrompt, nextResponse);
    push({ role: "ai", label: "Next stage", text: nextResponse });

    setLoading(false);
    setStage("feedback"); // cycle repeats
  }

  // Auto-fires the technical question once we enter the "questionPhase" stage,
  // mirroring the original Streamlit `if show_question: handle_question_phase(); st.rerun()`.
  useEffect(() => {
    if (stage !== "questionPhase" || questionPhaseFired.current) return;
    questionPhaseFired.current = true;
    (async () => {
      setLoading(true);
      const sys = questionSystemPrompt(currentTopic, childInterest);
      const prompt = questionUserPrompt(currentTopic);
      const { text: aiQuestion } = await callAI(sys, prompt, history);
      pushHistory(prompt, aiQuestion);
      push({ role: "ai", label: "Question", text: aiQuestion });
      setLoading(false);
      setStage("answer");
      questionPhaseFired.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [entries, loading]);

  function resetSession() {
    setEntries([]);
    setHistory([]);
    setStage("question");
    setCurrentTopic("");
    setChildInterest("");
    setInput("");
    questionPhaseFired.current = false;
  }

  function submit() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (stage === "question") handleQuestionSubmit(text);
    else if (stage === "feedback") handleFeedbackSubmit(text);
    else if (stage === "interest") handleInterestSubmit(text);
    else if (stage === "answer") handleAnswerSubmit(text);
  }

  const placeholder =
    stage === "question"
      ? 'e.g. "Explain the concept of gravity"'
      : stage === "feedback"
      ? "Type your understanding here…"
      : stage === "interest"
      ? "e.g., sports, cooking, technology…"
      : stage === "answer"
      ? "Type your answer here…"
      : "";

  const composerLabel =
    stage === "question"
      ? "Submit a question to begin"
      : stage === "feedback"
      ? "Explain what you understood"
      : stage === "interest"
      ? "What interests you?"
      : stage === "answer"
      ? "Your answer"
      : "";

  const showInput = stage !== "questionPhase";

  return (
    <div className="flex h-dvh flex-col">
      {/* ---------------- Top bar / tabs ---------------- */}
      <header className="flex flex-none items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="font-semibold text-white">📚 Learning Companion</span>
        <nav className="flex gap-1 rounded-full border border-white/15 bg-white/5 p-1">
          {(["about", "learn", "visualize"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wide transition ${
                tab === t ? "bg-white text-slate-900" : "text-blue-200 hover:text-white"
              }`}
            >
              {t === "about" ? "About" : t === "learn" ? "Learn" : "Visualize"}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        {/* ===================== ABOUT ===================== */}
        {tab === "about" && (
          <div className="mx-auto max-w-2xl px-5 py-10">
            <p className="font-mono text-xs uppercase tracking-widest text-purple-300">Structured AI tutoring</p>
            <h1 className="mt-2 text-3xl font-bold text-white">A learning companion that won&apos;t let you skim</h1>
            <p className="mt-3 text-blue-200">
              Instead of answering once and moving on, this app runs a fixed five-step teaching
              cycle around whatever you ask about — it checks you actually understood before
              going further.
            </p>

            <ol className="mt-8 space-y-4">
              {[
                ["Ask", "You submit a concept or question you want explained."],
                ["Explain", "A structured, academic-level explanation — not a one-liner."],
                ["Reflect", "You say what you understood; gaps get identified and corrected, directly."],
                ["Personalize", "The concept gets retold as one coherent story built around something you're actually interested in."],
                ["Test & expand", "A technical question checks real understanding, then the next, deeper stage of the same topic begins — and the cycle repeats."],
              ].map(([title, desc], i) => (
                <li key={title} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="font-mono text-sm text-purple-300">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <div className="font-semibold text-white">{title}</div>
                    <div className="text-sm text-blue-200">{desc}</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="font-mono text-xs text-purple-300">01 — this page</div>
                <div className="mt-1 font-semibold text-white">About</div>
                <div className="mt-1 text-sm text-blue-200">What this is and how the cycle works.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="font-mono text-xs text-purple-300">02 — Learn tab</div>
                <div className="mt-1 font-semibold text-white">Learn</div>
                <div className="mt-1 text-sm text-blue-200">The actual five-step cycle, running live.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 opacity-60">
                <div className="font-mono text-xs text-purple-300">03 — Visualize tab</div>
                <div className="mt-1 font-semibold text-white">
                  Visualize{" "}
                  <span className="ml-1 rounded-full border border-purple-300 px-2 py-0.5 text-[10px] uppercase text-purple-300">
                    Soon
                  </span>
                </div>
                <div className="mt-1 text-sm text-blue-200">A map of everything you&apos;ve worked through.</div>
              </div>
            </div>

            <button
              onClick={() => setTab("learn")}
              className="mt-8 w-full rounded-xl bg-purple-500 py-3 font-medium text-white transition hover:bg-purple-600"
            >
              Start learning →
            </button>
          </div>
        )}

        {/* ===================== LEARN (the actual cycle, wide workspace) ===================== */}
        {tab === "learn" && (
          <div className="mx-auto flex h-full max-w-4xl flex-col px-5">
            <div className="flex flex-none items-start justify-between pt-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-purple-300">Step-by-step</p>
                <h1 className="text-xl font-bold text-white">The learning cycle</h1>
              </div>
              <button
                onClick={resetSession}
                className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-blue-100 hover:bg-white/10"
              >
                Reset
              </button>
            </div>

            <div ref={transcriptRef} className="min-h-0 flex-1 overflow-y-auto py-6">
              {entries.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-blue-200">
                  <p className="font-mono text-xs uppercase tracking-widest text-purple-300">Try asking</p>
                  <p className="mt-2 font-mono text-sm leading-loose">
                    &quot;Explain the concept of gravity&quot;
                    <br />
                    &quot;How does photosynthesis work?&quot;
                    <br />
                    &quot;What is a derivative?&quot;
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {entries.map((e, i) => (
                    <div key={i} className="grid grid-cols-[100px_1fr] gap-4 py-5 sm:grid-cols-[130px_1fr]">
                      <div
                        className={`font-mono text-[11px] uppercase tracking-wide ${
                          e.role === "user" ? "text-purple-300" : "text-blue-300"
                        }`}
                      >
                        {e.label}
                      </div>
                      {e.special ? (
                        <div className="rounded-xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-400/10 to-orange-400/10 p-4 leading-relaxed text-amber-100">
                          {e.text}
                        </div>
                      ) : (
                        <div className="leading-relaxed text-slate-100">{e.text}</div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="grid grid-cols-[100px_1fr] gap-4 py-5 sm:grid-cols-[130px_1fr]">
                      <div className="font-mono text-[11px] uppercase tracking-wide text-blue-300">…</div>
                      <div className="italic text-blue-300/70">Thinking…</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {showInput && (
              <div className="flex-none border-t border-white/10 py-4">
                <div className="mb-2 text-sm font-medium text-white">{composerLabel}</div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  className="flex gap-2"
                >
                  {stage === "feedback" || stage === "answer" ? (
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={placeholder}
                      rows={2}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-white/20 bg-white/5 p-3 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none disabled:bg-white/[0.02]"
                    />
                  ) : (
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={placeholder}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-white/20 bg-white/5 p-3 text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none disabled:bg-white/[0.02]"
                    />
                  )}
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="shrink-0 rounded-xl bg-purple-500 px-6 font-medium text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {stage === "answer" ? "Submit Answer" : "Submit"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ===================== VISUALIZE (coming soon) ===================== */}
        {tab === "visualize" && (
          <div className="flex h-full items-center justify-center px-5">
            <div className="relative max-w-md overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-10 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-purple-300">Coming soon</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Visualize</h2>
              <p className="mt-2 text-blue-200">
                A map of every concept, story, and question from your Learn sessions, laid out
                visually instead of as a transcript. Not built yet — the Learn cycle comes first.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
