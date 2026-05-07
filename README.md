# ADHD Learning Buddy

A structured AI-powered learning system built with Streamlit that guides users through progressive understanding of concepts using explanation, feedback, questioning, and adaptive teaching cycles.

The system is designed as an interactive learning companion that simulates a tutor-like experience: it explains concepts, evaluates user understanding, introduces personalized examples, and progressively deepens knowledge through iterative questioning.

---

# Overview

ADHD Learning Buddy is a multi-stage educational dialogue system that:

- Explains academic concepts using structured reasoning
- Evaluates user understanding through feedback loops
- Adapts explanations based on user input
- Personalizes learning using user interests
- Tests comprehension through technical questioning
- Builds progressively deeper conceptual understanding

The system uses a cyclical learning architecture rather than a linear Q&A model.

---

# System Architecture

The learning flow follows a structured multi-stage pipeline:

## Stage 1: Concept Introduction
The user submits a question.

System generates:
- A structured academic explanation
- Step-by-step conceptual breakdown
- Technical terminology with definitions

---

## Stage 2: User Feedback Loop
User explains what they understood.

System:
- Identifies gaps in understanding
- Corrects misconceptions
- Reinforces missing concepts
- Encourages refinement of understanding

---

## Stage 3: Interest-Based Personalization
User provides personal interests.

System:
- Maps abstract concept to real-world context
- Generates a coherent narrative example
- Uses analogy grounded in user interest
- Maintains conceptual consistency across explanation

---

## Stage 4: Knowledge Testing
System generates a technical question:

- Evaluates conceptual comprehension
- Tests applied understanding
- Encourages critical reasoning

---

## Stage 5: Evaluation and Expansion
User answers question.

System:
- Evaluates correctness
- Provides structured feedback
- Expands topic into next conceptual level
- Maintains continuity of learning context

---

# Core Technologies

- Python
- Streamlit
- Requests
- OpenRouter API
- Google Gemini model (via API routing)

---

# Key Design Principles

## 1. Progressive Learning
Knowledge is not delivered all at once. Instead, it is layered across multiple interactions.

## 2. Cognitive Reinforcement Loop
Each cycle includes:
- Explanation
- Reflection
- Personalization
- Testing
- Expansion

## 3. Context Persistence
The system maintains:
- Conversation history
- Current topic
- User interest profile

This ensures continuity across learning stages.

## 4. Adaptive Difficulty
The system dynamically adjusts:
- Depth of explanation
- Complexity of questions
- Level of conceptual expansion

---

# Data Flow

```
User Question
    ↓
AI Explanation (PhD-level breakdown)
    ↓
User Feedback
    ↓
Gap Analysis + Correction
    ↓
Interest Input
    ↓
Contextual Story Generation
    ↓
Technical Question
    ↓
Answer Evaluation
    ↓
Next-Level Concept Expansion
```

---

# API Integration

The system uses OpenRouter API for LLM inference.

## Model Used
- google/gemini-2.5-flash-lite

## Request Structure

Each request includes:
- System prompt (role definition)
- Conversation history
- User input prompt

This ensures contextual continuity across interactions.

---

# Session State Management

Streamlit session state is used to manage:

- messages (chat history)
- conversation_history (API memory)
- current_topic (active concept)
- child_interest (user preference mapping)
- stage flags:
  - show_feedback
  - show_interest_prompt
  - show_question
  - show_answer_input

This enables multi-step learning workflows without losing state.

---

# Learning Methodology

The system follows a structured pedagogical approach:

## Constructivist Learning
Users build understanding through:
- explanation
- correction
- application
- testing

## Socratic Method
The system uses:
- guided questioning
- feedback loops
- incremental complexity

## Contextual Learning
Abstract concepts are mapped to:
- real-world analogies
- user interests
- narrative-based examples

---

# Conversation Engine

The AI behavior is controlled through dynamic system prompts:

## Explanation Mode
- Academic tone
- Step-by-step reasoning
- Technical clarity

## Feedback Mode
- Error correction
- Gap identification
- Encouragement with precision

## Story Mode
- Contextual analogy
- Continuous narrative
- Real-world mapping

## Testing Mode
- Technical questioning
- Concept validation
- Applied reasoning

## Expansion Mode
- Next-level concept introduction
- Progressive difficulty scaling

---

# Limitations

- Dependent on external API availability
- No offline mode
- Not a diagnostic or psychological evaluation tool
- Responses may vary based on model behavior
- Requires stable internet connection

---

# Security Consideration

API key is currently embedded in code.

Recommended improvement:
- Move API key to environment variables or Streamlit secrets
- Avoid hardcoding credentials in production

---

# File Structure

```
project/
│
├── app.py
├── README.md
└── .streamlit/
    └── secrets.toml
```

---

# Future Improvements

- Memory summarization system
- Spaced repetition integration
- Adaptive difficulty scoring
- Visual concept mapping
- Learning progress tracking
- Multi-subject support
- Offline fallback model
- Personalized curriculum generation

---

# Use Cases

- Concept learning support
- Academic tutoring simulation
- Self-directed study enhancement
- Structured knowledge building
- Exam preparation support
- Concept reinforcement training

---

# Disclaimer

This tool is designed for educational and informational purposes only.

It is not:
- a clinical diagnostic system
- a psychological assessment tool
- a medical intervention platform

It should not be used as a substitute for professional educational or psychological guidance.

---

# License

Educational use only.

---

# Author

Developed using:
- Streamlit
- OpenRouter API
- Large Language Models
- Python
```
