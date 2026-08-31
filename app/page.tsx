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

type Msg = { type: "user" | "feedback" | "ai" | "system"; text: string; special?: boolean };
type HistoryMsg = { role: "user" | "assistant"; content: string };
type Stage = "question" | "feedback" | "interest" | "questionPhase" | "answer";

async function callAI(systemPrompt: string, userPrompt: string, history: HistoryMsg[]) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userPrompt, history }),
  });
  const data = await res.json();
  if (!res.ok) {
    return `Oops! I'm having trouble thinking right now. Can you try again? 🤔 (Error: ${data.error || res.status})`;
  }
  return data.response as string;
}

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [history, setHistory] = useState<HistoryMsg[]>([]);
  const [stage, setStage] = useState<Stage>("question");
  const [currentTopic, setCurrentTopic] = useState("");
  const [childInterest, setChildInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const questionPhaseFired = useRef(false);

  function pushHistory(userPrompt: string, aiResponse: string) {
    setHistory((h) => [...h, { role: "user", content: userPrompt }, { role: "assistant", content: aiResponse }]);
  }

  async function handleQuestionSubmit(userInput: string) {
    setMessages((m) => [...m, { type: "user", text: userInput }]);
    setCurrentTopic(userInput);
    setLoading(true);
    const aiResponse = await callAI(EXPLANATION_SYSTEM_PROMPT, userInput, history);
    pushHistory(userInput, aiResponse);
    setMessages((m) => [...m, { type: "ai", text: aiResponse }]);
    setLoading(false);
    setStage("feedback");
  }

  async function handleFeedbackSubmit(feedbackText: string) {
    setMessages((m) => [...m, { type: "feedback", text: feedbackText }]);
    setLoading(true);
    const prompt = feedbackUserPrompt(feedbackText);
    const aiResponse = await callAI(FEEDBACK_SYSTEM_PROMPT, prompt, history);
    pushHistory(prompt, aiResponse);
    setMessages((m) => [...m, { type: "ai", text: aiResponse }]);
    setLoading(false);
    setStage("interest");
  }

  async function handleInterestSubmit(interestText: string) {
    setMessages((m) => [...m, { type: "user", text: interestText }]);
    setChildInterest(interestText);
    setLoading(true);
    const sys = storySystemPrompt(interestText, currentTopic);
    const prompt = storyUserPrompt(currentTopic, interestText);
    const aiResponse = await callAI(sys, prompt, history);
    pushHistory(prompt, aiResponse);
    setMessages((m) => [...m, { type: "ai", text: aiResponse, special: true }]);
    setLoading(false);
    setStage("questionPhase");
  }

  async function handleAnswerSubmit(answerText: string) {
    setMessages((m) => [...m, { type: "user", text: answerText }]);
    setLoading(true);

    const evalSys = answerEvalSystemPrompt(currentTopic, childInterest);
    const evalPrompt = answerEvalUserPrompt(answerText);
    const evalResponse = await callAI(evalSys, evalPrompt, history);
    pushHistory(evalPrompt, evalResponse);
    setMessages((m) => [...m, { type: "ai", text: evalResponse }]);

    const nextSys = nextStageSystemPrompt(childInterest);
    const nextPrompt = nextStageUserPrompt(currentTopic, childInterest);
    const nextResponse = await callAI(nextSys, nextPrompt, [
      ...history,
      { role: "user", content: evalPrompt },
      { role: "assistant", content: evalResponse },
    ]);
    pushHistory(nextPrompt, nextResponse);
    setMessages((m) => [...m, { type: "ai", text: nextResponse }]);

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
      const aiResponse = await callAI(sys, prompt, history);
      pushHistory(prompt, aiResponse);
      setMessages((m) => [...m, { type: "ai", text: aiResponse }]);
      setLoading(false);
      setStage("answer");
      questionPhaseFired.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function resetSession() {
    setMessages([]);
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
      ? 'Type your question here... e.g. "Explain the concept of gravity"'
      : stage === "feedback"
      ? "Type your understanding here..."
      : stage === "interest"
      ? "e.g., sports, cooking, technology..."
      : stage === "answer"
      ? "Type your answer here..."
      : "";

  const label =
    stage === "question"
      ? "Submit your question:"
      : stage === "feedback"
      ? "Explain what you understood:"
      : stage === "interest"
      ? "What interests you?"
      : stage === "answer"
      ? "Your answer:"
      : "";

  const showInput = stage !== "questionPhase";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">📚 Learning Companion</h1>
          <p className="mt-1 text-gray-600">
            Ask questions and deepen your understanding through structured explanations.
          </p>
        </div>
        <button
          onClick={resetSession}
          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset Session
        </button>
      </div>

      <hr className="my-6 border-gray-300" />

      {messages.length === 0 ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
          Submit a question to begin your learning session.
          <br />
          <br />
          Example: &quot;Explain the concept of gravity&quot;
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className="clear-both">
              {msg.type === "user" && (
                <div className="float-right max-w-[70%] rounded-2xl bg-purple-500 px-4 py-3 text-white">
                  {msg.text}
                </div>
              )}
              {msg.type === "feedback" && (
                <div className="float-right max-w-[70%] rounded-2xl bg-blue-500 px-4 py-3 text-white">
                  <div className="mb-1 text-xs opacity-80">My Understanding:</div>
                  {msg.text}
                </div>
              )}
              {msg.type === "ai" &&
                (msg.special ? (
                  <div className="float-left max-w-[70%] rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-100 to-orange-100 p-4 text-amber-900">
                    {msg.text}
                  </div>
                ) : (
                  <div className="float-left max-w-[70%] rounded-2xl bg-gray-100 px-4 py-3 text-gray-800">
                    {msg.text}
                  </div>
                ))}
              {msg.type === "system" && (
                <div className="mx-auto w-fit rounded-full bg-emerald-100 px-6 py-3 text-center font-semibold text-emerald-800">
                  {msg.text}
                </div>
              )}
              <div className="clear-both" />
            </div>
          ))}
          {loading && (
            <div className="clear-both">
              <div className="float-left max-w-[70%] rounded-2xl bg-gray-100 px-4 py-3 text-gray-500 italic">
                Thinking…
              </div>
              <div className="clear-both" />
            </div>
          )}
        </div>
      )}

      <hr className="my-6 border-gray-300" />

      {showInput && (
        <div>
          <h3 className="mb-2 font-semibold">{label}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-2"
          >
            {stage === "feedback" || stage === "answer" ? (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                rows={4}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 p-3 focus:border-purple-400 focus:outline-none disabled:bg-gray-50"
              />
            ) : (
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 p-3 focus:border-purple-400 focus:outline-none disabled:bg-gray-50"
              />
            )}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full rounded-xl bg-purple-500 py-3 font-medium text-white transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stage === "answer" ? "Submit Answer" : "Submit"}
            </button>
          </form>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        💡 <strong>Note:</strong> Take time to fully understand each concept before moving
        forward. If something is unclear, ask for clarification.
      </div>
    </main>
  );
}
