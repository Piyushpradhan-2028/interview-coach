import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Mic,
  MicOff,
  Send,
  ChevronRight,
  ArrowLeft,
  Menu,
  X,
  Loader2,
  MessageSquare,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Code2,
  BarChart3,
  Target,
  Sparkles,
  TrendingUp,
  Home,
  User,
  RotateCcw,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* =========================================================
   CONSTANTS
========================================================= */

const API_URL = "/api/claude";

const SEED_HISTORY = [
  {
    date: "Jul 27",
    type: "HR",
    difficulty: "Easy",
    score: 75,
  },
  {
    date: "Jul 28",
    type: "Technical",
    difficulty: "Medium",
    score: 82,
  },
  {
    date: "Jul 29",
    type: "Mixed",
    difficulty: "Hard",
    score: 68,
  },
  {
    date: "Jul 30",
    type: "Technical",
    difficulty: "Medium",
    score: 79,
  },
];

const CATEGORY_SEQ = {
  hr: ["HR", "HR", "HR", "HR"],
  technical: ["Technical", "Technical", "Technical", "Technical"],
  mixed: ["HR", "Technical", "HR", "Technical"],
  full: [
    "Introduction",
    "HR",
    "Technical",
    "Project",
    "Situational",
    "Final HR",
  ],
};

const ENGLISH_PROMPTS = [
  "Tell me about your college experience.",
  "What are your career goals?",
  "Describe a project you are proud of.",
  "What technology do you enjoy learning?",
  "What is one challenge you faced as a student?",
  "Why did you choose Computer Science?",
  "Tell me about your daily routine.",
  "What kind of job are you looking for?",
];

const FILLERS = [
  "um",
  "umm",
  "uh",
  "uhh",
  "like",
  "actually",
  "basically",
  "you know",
  "sort of",
  "kind of",
];

/* =========================================================
   CLAUDE API
========================================================= */

async function askClaude(system, userText, maxTokens = 1024) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system,
        userText,
        maxTokens,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return "";
    }

    return data.text || "";
  } catch (error) {
    console.error("Backend connection error:", error);
    return "";
  }
}

/* =========================================================
   HELPERS
========================================================= */

function parseJSONSafe(text, fallback) {
  if (!text) return fallback;

  let cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }

    return fallback;
  }
}

function countFillers(text) {
  const lower = ` ${text.toLowerCase()} `;
  let total = 0;
  const found = {};

  FILLERS.forEach((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(
      `\\b${escaped.replace(" ", "\\s+")}\\b`,
      "g"
    );

    const matches = lower.match(regex);

    if (matches) {
      total += matches.length;
      found[word] = matches.length;
    }
  });

  return {
    total,
    found,
  };
}

function scoreClass(score) {
  if (score >= 75) return "score-good";
  if (score >= 55) return "score-mid";
  return "score-low";
}

/* =========================================================
   NAVIGATION
========================================================= */

function Navigation({ view, setView, profile }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      id: "setup",
      label: "Interview",
      icon: Briefcase,
    },
    {
      id: "english",
      label: "English",
      icon: BookOpen,
    },
    {
      id: "progress",
      label: "Progress",
      icon: BarChart3,
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
    },
  ];

  const go = (page) => {
    setView(page);
    setMobileOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <button
          className="logo"
          style={{
            background: "transparent",
            border: "none",
            color: "#f4f2ea",
          }}
          onClick={() => go("dashboard")}
        >
          <span className="logo-icon">
            <Mic size={17} />
          </span>
          MockRoom
        </button>

        <div className="nav-links">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-btn ${
                  view === item.id ? "active" : ""
                }`}
                onClick={() => go(item.id)}
              >
                <Icon size={15} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="profile-mini">
          <div className="avatar-mini">
            {profile.name
              ? profile.name.charAt(0).toUpperCase()
              : "S"}
          </div>

          {profile.name || "Student"}
        </div>

        <button
          className="btn btn-secondary mobile-only"
          style={{ padding: 8 }}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="container" style={{ paddingBottom: 12 }}>
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className="nav-btn"
                style={{
                  width: "100%",
                  justifyContent: "flex-start",
                }}
                onClick={() => go(item.id)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}

/* =========================================================
   LANDING PAGE
========================================================= */

function Landing({ go }) {
  return (
    <div className="container">
      <section className="hero">
        <div>
          <div className="badge">
            <Sparkles size={13} />
            Built for B.Tech placement preparation
          </div>

          <h1>
            Practice interviews.
            <br />
            Improve communication.
            <br />
            <span className="gold">Get placement ready.</span>
          </h1>

          <p className="hero-description">
            Your AI interview partner asks realistic campus
            placement questions, analyzes your answers,
            corrects your English, and helps you speak with
            confidence.
          </p>

          <div className="buttons">
            <button
              className="btn btn-primary"
              onClick={() => go("setup")}
            >
              Start Interview
              <ChevronRight size={17} />
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => go("english")}
            >
              Practice English
            </button>
          </div>
        </div>

        <div className="card demo-card">
          <div className="ai-header">
            <div className="ai-avatar">
              <GraduationCap size={25} />
            </div>

            <div>
              <strong>AI Interviewer</strong>
              <div className="faint" style={{ fontSize: 12 }}>
                Technical · Medium · Java
              </div>
            </div>
          </div>

          <div className="question-box">
            Explain the difference between an interface and
            an abstract class in Java.
          </div>

          <div
            className="question-box"
            style={{ marginTop: 12 }}
          >
            <div className="faint" style={{ fontSize: 11 }}>
              YOUR ANSWER
            </div>

            <p style={{ color: "#9ba1cb" }}>
              "Interface is like only having method and
              abstract class can have body also..."
            </p>
          </div>

          <div className="feedback-grid" style={{ marginTop: 12 }}>
            <div className="feedback-item">
              <div className="faint">Grammar</div>
              <div className="warning">6/10</div>
            </div>

            <div className="feedback-item">
              <div className="faint">Relevance</div>
              <div className="good">9/10</div>
            </div>

            <div className="feedback-item">
              <div className="faint">Structure</div>
              <div className="warning">7/10</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="grid grid-3">
          <div className="card">
            <Mic size={21} color="#e8a33d" />
            <h3>Speak, don't just type</h3>
            <p className="muted">
              Practice speaking using your microphone and
              improve your confidence.
            </p>
          </div>

          <div className="card">
            <BookOpen size={21} color="#e8a33d" />
            <h3>English correction</h3>
            <p className="muted">
              Get grammar, vocabulary, sentence and
              communication feedback.
            </p>
          </div>

          <div className="card">
            <Target size={21} color="#e8a33d" />
            <h3>Placement focused</h3>
            <p className="muted">
              Questions are designed around B.Tech campus
              placement interviews.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  profile,
  history,
  go,
  startDaily,
}) {
  const average =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + item.score, 0) /
            history.length
        )
      : 0;

  return (
    <div className="container section">
      <h1 className="page-title">
        Welcome back, {profile.name || "Student"}.
      </h1>

      <p className="page-subtitle">
        Continue your interview and communication preparation.
      </p>

      <div className="grid grid-4">
        <div className="card">
          <Briefcase size={18} color="#e8a33d" />
          <div className="stat-number">
            {history.length}
          </div>
          <div className="stat-label">
            Interviews Completed
          </div>
        </div>

        <div className="card">
          <MessageSquare size={18} color="#e8a33d" />
          <div className="stat-number">
            {history.length * 4}
          </div>
          <div className="stat-label">
            Questions Practiced
          </div>
        </div>

        <div className="card">
          <TrendingUp size={18} color="#e8a33d" />
          <div className="stat-number">
            {average}%
          </div>
          <div className="stat-label">
            Average Score
          </div>
        </div>

        <div className="card">
          <BookOpen size={18} color="#e8a33d" />
          <div className="stat-number">Improve</div>
          <div className="stat-label">
            English Communication
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>
            Today's Challenge
          </h2>

          <p className="muted">
            Explain one project you have built and describe
            the biggest challenge you faced.
          </p>

          <button
            className="btn btn-primary"
            onClick={startDaily}
          >
            <Mic size={15} />
            Start Practice
          </button>
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0 }}>
            Recommended
          </h2>

          <p className="muted">
            Practice a medium-level mixed interview to
            improve both technical and HR communication.
          </p>

          <button
            className="btn btn-secondary"
            onClick={() => go("setup")}
          >
            Start Interview
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>
          Recent Interviews
        </h2>

        {history.length === 0 ? (
          <div className="empty">
            No interview completed yet.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                </tr>
              </thead>

              <tbody>
                {history
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((item, index) => (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item.type}</td>
                      <td>{item.difficulty}</td>
                      <td className={scoreClass(item.score)}>
                        {item.score}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INTERVIEW SETUP
========================================================= */

function Setup({
  config,
  setConfig,
  onBegin,
}) {
  const types = [
    ["hr", "HR"],
    ["technical", "Technical"],
    ["mixed", "Mixed"],
    ["full", "Full Interview"],
  ];

  const difficulties = ["Easy", "Medium", "Hard"];

  const modes = [
    ["voice", "Voice"],
    ["text", "Text"],
  ];

  const topics = [
    "Random",
    "Java",
    "Python",
    "C/C++",
    "DSA",
    "DBMS",
    "SQL",
    "OOP",
    "OS",
    "Networks",
    "Web Development",
    "React",
    "Node.js",
    "Git",
    "AI/ML",
    "Projects",
  ];

  return (
    <div className="small-container section">
      <h1 className="page-title">
        Set up your interview
      </h1>

      <p className="page-subtitle">
        Select the type, difficulty and topic you want to
        practice.
      </p>

      <div className="card" style={{ marginBottom: 18 }}>
        <label className="label">Interview Type</label>

        <div className="option-row">
          {types.map(([id, label]) => (
            <button
              key={id}
              className={`option ${
                config.type === id ? "selected" : ""
              }`}
              onClick={() =>
                setConfig({
                  ...config,
                  type: id,
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <label className="label">Difficulty</label>

        <div className="option-row">
          {difficulties.map((level) => (
            <button
              key={level}
              className={`option ${
                config.difficulty === level
                  ? `selected ${level.toLowerCase()}`
                  : ""
              }`}
              onClick={() =>
                setConfig({
                  ...config,
                  difficulty: level,
                })
              }
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <label className="label">Answer Mode</label>

        <div className="option-row">
          {modes.map(([id, label]) => (
            <button
              key={id}
              className={`option ${
                config.mode === id ? "selected" : ""
              }`}
              onClick={() =>
                setConfig({
                  ...config,
                  mode: id,
                })
              }
            >
              {id === "voice" ? (
                <Mic
                  size={14}
                  style={{
                    verticalAlign: "-2px",
                    marginRight: 5,
                  }}
                />
              ) : (
                <MessageSquare
                  size={14}
                  style={{
                    verticalAlign: "-2px",
                    marginRight: 5,
                  }}
                />
              )}

              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <label className="label">Topic</label>

        <div className="option-row">
          {topics.map((topic) => (
            <button
              key={topic}
              className={`option ${
                config.topic === topic ? "selected" : ""
              }`}
              onClick={() =>
                setConfig({
                  ...config,
                  topic,
                })
              }
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={onBegin}
      >
        Start Interview
        <ChevronRight size={17} />
      </button>
    </div>
  );
}

/* =========================================================
   VOICE INPUT
========================================================= */

function VoiceInput({
  value,
  onChange,
  running,
  setRunning,
}) {
  const recognitionRef = useRef(null);

  const supported =
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window;

  const startListening = () => {
    if (!supported) {
      alert(
        "Speech recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      setRunning(true);
    };

    recognition.onresult = (event) => {
      let finalText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        finalText += event.results[i][0].transcript;
      }

      if (finalText.trim()) {
        onChange(
          value
            ? `${value} ${finalText}`.trim()
            : finalText.trim()
        );
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setRunning(false);
    };

    recognition.onend = () => {
      setRunning(false);
    };

    recognitionRef.current = recognition;

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setRunning(false);
  };

  return (
    <div className="voice-panel">
      <button
        className={`mic-button ${
          running ? "listening" : ""
        }`}
        onClick={
          running ? stopListening : startListening
        }
      >
        {running ? (
          <MicOff size={28} />
        ) : (
          <Mic size={28} />
        )}
      </button>

      <strong>
        {running
          ? "Listening..."
          : "Click microphone to speak"}
      </strong>

      <p className="faint" style={{ fontSize: 12 }}>
        {supported
          ? "Speak naturally in English."
          : "Use Google Chrome for voice input."}
      </p>
    </div>
  );
}

/* =========================================================
   INTERVIEW ROOM
========================================================= */

function InterviewRoom({
  config,
  profile,
  onFinish,
}) {
  const sequence =
    CATEGORY_SEQ[config.type] || CATEGORY_SEQ.mixed;

  const total =
    config.type === "full" ? 6 : 4;

  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQuestion, setLoadingQuestion] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [feedback, setFeedback] = useState(null);
  const [log, setLog] = useState([]);
  const [listening, setListening] = useState(false);

  const category =
    sequence[index % sequence.length];

  const fallbackQuestion = useCallback(
    (cat) => {
      const bank = {
        HR: "Tell me about yourself and why you are interested in this role.",
        Technical: `Can you explain the fundamentals of ${
          config.topic !== "Random"
            ? config.topic
            : "your strongest programming language"
        }?`,
        Introduction:
          "Please introduce yourself and tell me about your technical background.",
        Project:
          "Tell me about a project you are proud of and explain the problem it solves.",
        Situational:
          "Describe a difficult situation you faced during your studies and how you handled it.",
        "Final HR":
          "Why should we hire you and what are your career goals?",
      };

      return (
        bank[cat] ||
        "Tell me about a challenge you recently overcame."
      );
    },
    [config.topic]
  );

  const generateQuestion = useCallback(
    async (currentIndex, previousLog) => {
      setLoadingQuestion(true);
      setFeedback(null);
      setAnswer("");

      const cat =
        sequence[currentIndex % sequence.length];

      const context = previousLog
        .slice(-2)
        .map(
          (item) =>
            `Question: ${item.question}\nAnswer: ${item.answer}`
        )
        .join("\n\n");

      const system = `
You are a professional campus placement interviewer for B.Tech students in India.

Ask exactly ONE interview question.

Do not add:
- explanations
- numbering
- greetings
- markdown
- quotation marks

Difficulty:
${config.difficulty}

Easy = basic and beginner friendly.
Medium = requires explanation and understanding.
Hard = advanced, scenario based, or requires deeper reasoning.

The question must be appropriate for a B.Tech student.
`;

      const user = `
Category: ${cat}
Topic: ${config.topic}
Student branch: ${profile.branch}
Student skills: ${profile.skills}
Target role: ${profile.role}
Projects: ${profile.projects || "Not provided"}

${
  context
    ? `Previous conversation:\n${context}\n\nAsk a natural follow-up or next relevant question.`
    : "This is the first question."
}
`;

      const text = await askClaude(
        system,
        user,
        250
      );

      setQuestion(
        text.trim() || fallbackQuestion(cat)
      );

      setLoadingQuestion(false);
    },
    [
      config,
      profile,
      sequence,
      fallbackQuestion,
    ]
  );

  useEffect(() => {
    generateQuestion(0, []);
  }, [generateQuestion]);

  const mockFeedback = (studentAnswer) => ({
    overallScore: 70,
    communication: 7,
    grammar: 6,
    confidence: 7,
    relevance: 8,
    vocabulary: 6,
    structure: 7,
    mistakes: [],
    correctedAnswer: studentAnswer,
    betterAnswer: studentAnswer,
    whatWentWell: [
      "Your answer was relevant.",
      "You attempted to explain your idea clearly.",
    ],
    improve: [
      "Use shorter sentences.",
      "Give a structured answer.",
      "Avoid unnecessary filler words.",
    ],
    followUpQuestion:
      "Can you explain that with an example?",
  });

  const submitAnswer = async () => {
    if (!answer.trim()) return;

    setSubmitting(true);

    const system = `
You are an AI interview coach and English communication expert for B.Tech students in India preparing for campus placements.

Analyze the student's interview answer.

Be supportive but honest.

Identify:
- grammar mistakes
- vocabulary issues
- communication problems
- answer relevance
- confidence
- structure

Respond ONLY with valid JSON.

Schema:
{
  "overallScore": number,
  "communication": number,
  "grammar": number,
  "confidence": number,
  "relevance": number,
  "vocabulary": number,
  "structure": number,
  "mistakes": [
    {
      "issue": "string",
      "correct": "string"
    }
  ],
  "correctedAnswer": "string",
  "betterAnswer": "string",
  "whatWentWell": ["string"],
  "improve": ["string"],
  "followUpQuestion": "string"
}

Scores except overallScore must be 0-10.
overallScore must be 0-100.

Keep English corrections simple.

correctedAnswer:
Keep the student's original meaning but fix grammar and vocabulary.

betterAnswer:
Create a professional interview-ready answer without using unnecessarily difficult English.

followUpQuestion:
Ask a realistic follow-up question based on the student's answer.
`;

    const user = `
Interview question:
${question}

Student answer:
${answer}

Interview category:
${category}

Difficulty:
${config.difficulty}

Student target role:
${profile.role}
`;

    const raw = await askClaude(
      system,
      user,
      1400
    );

    const fallback =
      mockFeedback(answer);

    const result = parseJSONSafe(
      raw,
      fallback
    );

    setFeedback(result);

    setLog((previous) => [
      ...previous,
      {
        category,
        question,
        answer,
        feedback: result,
      },
    ]);

    setSubmitting(false);
  };

  const nextQuestion = async () => {
    if (index + 1 >= total) {
      onFinish(log);
      return;
    }

    const nextIndex = index + 1;

    setIndex(nextIndex);

    await generateQuestion(
      nextIndex,
      log
    );
  };

  const finishNow = () => {
    onFinish(log);
  };

  return (
    <div className="small-container section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <button
          className="btn btn-secondary"
          style={{ padding: "9px 14px" }}
          onClick={finishNow}
        >
          <ArrowLeft size={14} />
          End
        </button>

        <div className="faint" style={{ fontSize: 12 }}>
          Question {index + 1} of {total} · {category}
        </div>
      </div>

      <div className="progress">
        <div
          className="progress-bar"
          style={{
            width: `${
              ((index + (feedback ? 1 : 0)) /
                total) *
              100
            }%`,
          }}
        />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="ai-header">
          <div className="ai-avatar">
            <GraduationCap size={25} />
          </div>

          <div>
            <strong>AI Interviewer</strong>

            <div
              className="faint"
              style={{ fontSize: 12 }}
            >
              {config.type.toUpperCase()} ·{" "}
              {config.difficulty}
            </div>
          </div>
        </div>

        {loadingQuestion ? (
          <div className="loading">
            <Loader2
              size={17}
              className="spinner"
            />
            Generating question...
          </div>
        ) : (
          <div className="interview-question">
            {question}
          </div>
        )}
      </div>

      {!feedback && (
        <div
          className="card"
          style={{ marginTop: 18 }}
        >
          <label className="label">
            Your Answer
          </label>

          {config.mode === "voice" ? (
            <VoiceInput
              value={answer}
              onChange={setAnswer}
              running={listening}
              setRunning={setListening}
            />
          ) : null}

          <textarea
            className="textarea"
            style={{ marginTop: 15 }}
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder={
              config.mode === "voice"
                ? "Your speech will appear here..."
                : "Type your answer here..."
            }
          />

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 15 }}
            disabled={
              !answer.trim() || submitting
            }
            onClick={submitAnswer}
          >
            {submitting ? (
              <>
                <Loader2 className="spinner" size={16} />
                Analyzing...
              </>
            ) : (
              <>
                <Send size={15} />
                Submit Answer
              </>
            )}
          </button>
        </div>
      )}

      {feedback && (
        <Feedback
          feedback={feedback}
          answer={answer}
          onNext={nextQuestion}
          isLast={index + 1 >= total}
        />
      )}
    </div>
  );
}

/* =========================================================
   FEEDBACK
========================================================= */

function Feedback({
  feedback,
  answer,
  onNext,
  isLast,
}) {
  return (
    <div
      className="card"
      style={{ marginTop: 18 }}
    >
      <div className="feedback-score">
        <span className={scoreClass(feedback.overallScore)}>
          {feedback.overallScore}%
        </span>
      </div>

      <p
        className="faint"
        style={{
          textAlign: "center",
          marginTop: -5,
        }}
      >
        Overall Answer Score
      </p>

      <div className="feedback-grid">
        {[
          ["Communication", feedback.communication],
          ["Grammar", feedback.grammar],
          ["Confidence", feedback.confidence],
          ["Relevance", feedback.relevance],
          ["Vocabulary", feedback.vocabulary],
          ["Structure", feedback.structure],
        ].map(([label, value]) => (
          <div
            className="feedback-item"
            key={label}
          >
            <div className="faint">
              {label}
            </div>

            <div className="feedback-value">
              {value}/10
            </div>
          </div>
        ))}
      </div>

      {feedback.mistakes?.length > 0 && (
        <div className="correction">
          <div className="correction-title error">
            MISTAKES TO CORRECT
          </div>

          {feedback.mistakes.map(
            (mistake, index) => (
              <div
                key={index}
                style={{ marginBottom: 10 }}
              >
                <div>
                  <strong>
                    {mistake.issue}
                  </strong>
                </div>

                <div className="good">
                  Correct: {mistake.correct}
                </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="correction">
        <div className="correction-title good">
          WHAT YOU DID WELL
        </div>

        <ul>
          {(feedback.whatWentWell || []).map(
            (item, index) => (
              <li key={index}>{item}</li>
            )
          )}
        </ul>
      </div>

      <div className="correction">
        <div className="correction-title warning">
          WHAT TO IMPROVE
        </div>

        <ul>
          {(feedback.improve || []).map(
            (item, index) => (
              <li key={index}>{item}</li>
            )
          )}
        </ul>
      </div>

      <div className="correction">
        <div className="correction-title faint">
          YOUR ANSWER
        </div>

        <p>{answer}</p>
      </div>

      <div className="correction">
        <div className="correction-title good">
          CORRECTED ANSWER
        </div>

        <p>{feedback.correctedAnswer}</p>
      </div>

      <div
        className="correction"
        style={{
          borderColor: "#4c3b16",
        }}
      >
        <div className="correction-title warning">
          BETTER INTERVIEW ANSWER
        </div>

        <p>{feedback.betterAnswer}</p>
      </div>

      <div className="correction">
        <div className="correction-title">
          NEXT FOLLOW-UP QUESTION
        </div>

        <p>
          {feedback.followUpQuestion}
        </p>
      </div>

      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: 18 }}
        onClick={onNext}
      >
        {isLast
          ? "See Overall Evaluation"
          : "Next Question"}

        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* =========================================================
   SESSION SUMMARY
========================================================= */

function SessionSummary({
  log,
  config,
  onDone,
}) {
  if (!log.length) {
    return (
      <div className="small-container section">
        <div className="card empty">
          No answers were submitted.
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={onDone}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const average = Math.round(
    log.reduce(
      (sum, item) =>
        sum +
        (item.feedback.overallScore || 0),
      0
    ) / log.length
  );

  const chartData = [
    {
      name: "Communication",
      score: Math.round(
        average / 10
      ),
    },
    {
      name: "Grammar",
      score: Math.round(
        average / 10
      ),
    },
    {
      name: "Confidence",
      score: Math.round(
        average / 10
      ),
    },
    {
      name: "Relevance",
      score: Math.round(
        average / 10
      ),
    },
  ];

  return (
    <div className="small-container section">
      <div
        className="card"
        style={{ textAlign: "center" }}
      >
        <Award
          size={32}
          color="#e8a33d"
        />

        <h1 className="page-title">
          Interview Complete
        </h1>

        <p className="muted">
          {config.type.toUpperCase()} ·{" "}
          {config.difficulty}
        </p>

        <div
          className={`feedback-score ${scoreClass(
            average
          )}`}
        >
          {average}%
        </div>

        <p className="muted">
          Overall Performance
        </p>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Performance Overview</h2>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid
                stroke="#2c3268"
              />

              <XAxis
                dataKey="name"
                tick={{
                  fill: "#9ba1cb",
                  fontSize: 11,
                }}
              />

              <YAxis
                domain={[0, 10]}
                tick={{
                  fill: "#9ba1cb",
                }}
              />

              <Tooltip />

              <Bar
                dataKey="score"
                fill="#e8a33d"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {log.map((item, index) => (
          <div
            className="card"
            key={index}
            style={{ marginBottom: 10 }}
          >
            <div className="faint">
              {item.category}
            </div>

            <div style={{ marginTop: 5 }}>
              {item.question}
            </div>

            <div
              className={scoreClass(
                item.feedback.overallScore
              )}
              style={{
                marginTop: 8,
                fontWeight: 800,
              }}
            >
              Score:{" "}
              {item.feedback.overallScore}%
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary btn-full"
        onClick={onDone}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

/* =========================================================
   ENGLISH PRACTICE
========================================================= */

function EnglishPractice({ profile }) {
  const [prompt, setPrompt] =
    useState(ENGLISH_PROMPTS[0]);

  const [answer, setAnswer] =
    useState("");

  const [seconds, setSeconds] =
    useState(0);

  const [running, setRunning] =
    useState(false);

  const [feedback, setFeedback] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSeconds((value) => value + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [running]);

  const newPrompt = async () => {
    setFeedback(null);
    setAnswer("");
    setSeconds(0);
    setRunning(false);

    const system = `
Generate exactly ONE English speaking practice prompt for a B.Tech student preparing for campus placements.

It should improve communication and confidence.

Do not generate a technical interview question.

Return only the prompt.
`;

    const result = await askClaude(
      system,
      `Student branch: ${
        profile.branch || "Computer Science"
      }. Previous prompt: ${prompt}`,
      100
    );

    if (result.trim()) {
      setPrompt(result.trim());
    } else {
      const random =
        ENGLISH_PROMPTS[
          Math.floor(
            Math.random() *
              ENGLISH_PROMPTS.length
          )
        ];

      setPrompt(random);
    }
  };

  const analyze = async () => {
    if (!answer.trim()) return;

    setLoading(true);
    setRunning(false);

    const fillers = countFillers(answer);

    const system = `
You are an English communication coach for B.Tech students preparing for campus placements.

Analyze the student's spoken English answer.

Evaluate:
- fluency
- grammar
- vocabulary
- sentence formation
- confidence

Return ONLY valid JSON.

Schema:
{
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "sentenceFormation": number,
  "confidence": number,
  "overallScore": number,
  "mistakes": [
    {
      "issue": "string",
      "correct": "string"
    }
  ],
  "correctedAnswer": "string",
  "tip": "string"
}

All skill scores are 0-10.
overallScore is 0-100.

Keep the English simple.
`;

    const user = `
Prompt:
${prompt}

Student answer:
${answer}

Speaking time:
${seconds} seconds

Detected filler words:
${fillers.total}
`;

    const raw = await askClaude(
      system,
      user,
      1000
    );

    const fallback = {
      fluency: 7,
      grammar: 6,
      vocabulary: 6,
      sentenceFormation: 7,
      confidence: 6,
      overallScore: 68,
      mistakes: [],
      correctedAnswer: answer,
      tip:
        "Try pausing instead of using filler words.",
    };

    const result = parseJSONSafe(
      raw,
      fallback
    );

    result.fillers = fillers;

    setFeedback(result);
    setLoading(false);
  };

  const reset = () => {
    setAnswer("");
    setFeedback(null);
    setSeconds(0);
    setRunning(false);
  };

  return (
    <div className="small-container section">
      <h1 className="page-title">
        English Communication Practice
      </h1>

      <p className="page-subtitle">
        Speak for 30–60 seconds and get AI feedback.
      </p>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div className="label">
            TODAY'S SPEAKING PROMPT
          </div>

          <button
            className="btn btn-secondary"
            style={{
              padding: "7px 12px",
              fontSize: 12,
            }}
            onClick={newPrompt}
          >
            <RotateCcw size={12} />
            New Prompt
          </button>
        </div>

        <h2
          style={{
            fontFamily: "Georgia, serif",
            lineHeight: 1.5,
          }}
        >
          {prompt}
        </h2>
      </div>

      {!feedback ? (
        <div
          className="card"
          style={{ marginTop: 18 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <strong>Your Answer</strong>

            <span className="gold">
              {String(
                Math.floor(seconds / 60)
              ).padStart(2, "0")}
              :
              {String(seconds % 60).padStart(
                2,
                "0"
              )}
            </span>
          </div>

          <div style={{ marginTop: 15 }}>
            <VoiceInput
              value={answer}
              onChange={setAnswer}
              running={listening}
              setRunning={(value) => {
                setListening(value);
                setRunning(value);
              }}
            />
          </div>

          <textarea
            className="textarea"
            style={{ marginTop: 15 }}
            value={answer}
            onChange={(e) =>
              setAnswer(e.target.value)
            }
            placeholder="Your spoken answer will appear here..."
          />

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 15 }}
            disabled={!answer.trim() || loading}
            onClick={analyze}
          >
            {loading
              ? "Analyzing..."
              : "Get AI Feedback"}
          </button>
        </div>
      ) : (
        <div
          className="card"
          style={{ marginTop: 18 }}
        >
          <div className="feedback-score">
            <span
              className={scoreClass(
                feedback.overallScore
              )}
            >
              {feedback.overallScore}%
            </span>
          </div>

          <div className="feedback-grid">
            {[
              ["Fluency", feedback.fluency],
              ["Grammar", feedback.grammar],
              [
                "Vocabulary",
                feedback.vocabulary,
              ],
              [
                "Sentence",
                feedback.sentenceFormation,
              ],
              [
                "Confidence",
                feedback.confidence,
              ],
            ].map(([label, value]) => (
              <div
                className="feedback-item"
                key={label}
              >
                <div className="faint">
                  {label}
                </div>

                <div className="feedback-value">
                  {value}/10
                </div>
              </div>
            ))}
          </div>

          <div className="correction">
            <div className="correction-title warning">
              FILLER WORDS
            </div>

            <p>
              {feedback.fillers?.total || 0}
            </p>

            <p className="muted">
              Try pausing briefly instead of
              saying "um", "like", or
              "basically".
            </p>
          </div>

          {feedback.mistakes?.length > 0 && (
            <div className="correction">
              <div className="correction-title error">
                ENGLISH MISTAKES
              </div>

              {feedback.mistakes.map(
                (mistake, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: 10,
                    }}
                  >
                    <strong>
                      {mistake.issue}
                    </strong>

                    <div className="good">
                      Correct:{" "}
                      {mistake.correct}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="correction">
            <div className="correction-title good">
              CORRECTED VERSION
            </div>

            <p>
              {feedback.correctedAnswer}
            </p>
          </div>

          <div className="correction">
            <div className="correction-title warning">
              AI TIP
            </div>

            <p>{feedback.tip}</p>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={reset}
          >
            Practice Again
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PROGRESS
========================================================= */

function Progress({ history }) {
  const data = history.map(
    (item, index) => ({
      name: index + 1,
      score: item.score,
    })
  );

  return (
    <div className="container section">
      <h1 className="page-title">
        Your Progress
      </h1>

      <p className="page-subtitle">
        Track how your interview performance improves.
      </p>

      <div className="card">
        {history.length > 0 ? (
          <div
            style={{
              width: "100%",
              height: 320,
            }}
          >
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid stroke="#2c3268" />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#9ba1cb",
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{
                    fill: "#9ba1cb",
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#e8a33d"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty">
            Complete an interview to see
            your progress.
          </div>
        )}
      </div>

      <div
        className="card"
        style={{ marginTop: 18 }}
      >
        <h2>Full History</h2>

        {history.length === 0 ? (
          <div className="empty">
            No history available.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                </tr>
              </thead>

              <tbody>
                {history
                  .slice()
                  .reverse()
                  .map((item, index) => (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item.type}</td>
                      <td>
                        {item.difficulty}
                      </td>
                      <td
                        className={scoreClass(
                          item.score
                        )}
                      >
                        {item.score}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Profile({
  profile,
  setProfile,
}) {
  const [local, setLocal] =
    useState(profile);

  const [saved, setSaved] =
    useState(false);

  const update = (key, value) => {
    setLocal((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const save = () => {
    setProfile(local);
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="small-container section">
      <h1 className="page-title">
        Your Profile
      </h1>

      <p className="page-subtitle">
        The AI uses this information to personalize
        interview questions.
      </p>

      <div className="card">
        <label className="label">
          Name
        </label>

        <input
          className="input"
          value={local.name || ""}
          onChange={(e) =>
            update("name", e.target.value)
          }
          placeholder="Your name"
        />

        <label
          className="label"
          style={{ marginTop: 16 }}
        >
          B.Tech Branch
        </label>

        <input
          className="input"
          value={local.branch || ""}
          onChange={(e) =>
            update(
              "branch",
              e.target.value
            )
          }
          placeholder="Computer Science Engineering"
        />

        <label
          className="label"
          style={{ marginTop: 16 }}
        >
          Target Role
        </label>

        <input
          className="input"
          value={local.role || ""}
          onChange={(e) =>
            update("role", e.target.value)
          }
          placeholder="Software Developer"
        />

        <label
          className="label"
          style={{ marginTop: 16 }}
        >
          Skills
        </label>

        <textarea
          className="textarea"
          value={local.skills || ""}
          onChange={(e) =>
            update(
              "skills",
              e.target.value
            )
          }
          placeholder="Java, Python, React, SQL..."
        />

        <label
          className="label"
          style={{ marginTop: 16 }}
        >
          Projects
        </label>

        <textarea
          className="textarea"
          value={local.projects || ""}
          onChange={(e) =>
            update(
              "projects",
              e.target.value
            )
          }
          placeholder="Hospital Management System..."
        />

        <button
          className="btn btn-primary btn-full"
          style={{ marginTop: 18 }}
          onClick={save}
        >
          {saved ? "Saved ✓" : "Save Profile"}
        </button>
      </div>

      <p
        className="faint"
        style={{
          textAlign: "center",
          fontSize: 12,
          marginTop: 12,
        }}
      >
        Profile is stored only in the current browser
        session. MongoDB is not required yet.
      </p>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [view, setView] =
    useState("landing");

  const [profile, setProfile] =
    useState({
      name: "Piyush",
      branch:
        "Computer Science Engineering",
      role:
        "Software Development Engineer",
      skills:
        "Java, Python, React, SQL",
      projects:
        "Hospital Management System",
    });

  const [config, setConfig] =
    useState({
      type: "mixed",
      difficulty: "Medium",
      mode: "voice",
      topic: "Random",
    });

  const [history, setHistory] =
    useState(SEED_HISTORY);

  const [lastLog, setLastLog] =
    useState([]);

  const [dailyMode, setDailyMode] =
    useState(false);

  const go = (page) => {
    setView(page);
    window.scrollTo(0, 0);
  };

  const finishInterview = (log) => {
    setLastLog(log);

    if (log.length > 0) {
      const average = Math.round(
        log.reduce(
          (sum, item) =>
            sum +
            (item.feedback.overallScore ||
              0),
          0
        ) / log.length
      );

      const date = new Date();

      const type = dailyMode
        ? "Daily"
        : config.type
            .charAt(0)
            .toUpperCase() +
          config.type.slice(1);

      setHistory((previous) => [
        ...previous,
        {
          date: `${date.toLocaleString(
            "en",
            { month: "short" }
          )} ${date.getDate()}`,
          type,
          difficulty:
            config.difficulty,
          score: average,
        },
      ]);
    }

    go("summary");
  };

  const startDaily = () => {
    setConfig({
      type: "mixed",
      difficulty: "Medium",
      mode: "voice",
      topic: "Projects",
    });

    setDailyMode(true);
    go("interview");
  };

  return (
    <div className="app">
      {view !== "landing" && (
        <Navigation
          view={view}
          setView={go}
          profile={profile}
        />
      )}

      {view === "landing" && (
        <Landing go={go} />
      )}

      {view === "dashboard" && (
        <Dashboard
          profile={profile}
          history={history}
          go={go}
          startDaily={startDaily}
        />
      )}

      {view === "setup" && (
        <Setup
          config={config}
          setConfig={setConfig}
          onBegin={() => {
            setDailyMode(false);
            go("interview");
          }}
        />
      )}

      {view === "interview" && (
        <InterviewRoom
          config={config}
          profile={profile}
          onFinish={finishInterview}
        />
      )}

      {view === "summary" && (
        <SessionSummary
          log={lastLog}
          config={config}
          onDone={() => go("dashboard")}
        />
      )}

      {view === "english" && (
        <EnglishPractice
          profile={profile}
        />
      )}

      {view === "progress" && (
        <Progress history={history} />
      )}

      {view === "profile" && (
        <Profile
          profile={profile}
          setProfile={setProfile}
        />
      )}

      <footer className="footer">
        MockRoom · AI Interview Practice &
        English Communication Coach for B.Tech
        students
      </footer>
    </div>
  );
}