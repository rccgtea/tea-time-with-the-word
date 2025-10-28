# AI Accuracy & Biblical Faithfulness Measures

## Overview
This document outlines the safeguards implemented to ensure the AI chat assistant provides accurate, biblically-grounded responses without hallucination or misinformation.

## Key Safeguards

### 1. **Strict System Instructions**
The AI is given explicit instructions to:
- ONLY use information from the Holy Bible (Old and New Testament)
- Cite specific book, chapter, and verse for ANY biblical reference (e.g., "John 3:16 says...")
- Never make up information or use non-biblical sources
- Admit uncertainty with "I don't know" rather than speculate
- Clearly state when the Bible doesn't address a topic

### 2. **Reduced Temperature Settings**
For chat responses, we use:
- **Temperature: 0.3** (instead of 0.7) - Significantly reduces creativity and randomness
- **TopP: 0.8** - Limits diversity to stick to high-probability (factual) tokens
- **TopK: 20** - Restricts token selection to the 20 most likely options

**What this means:** The AI will be more conservative and stick to well-established biblical facts rather than being creative or imaginative.

### 3. **Explicit Guidelines**
The system instruction emphasizes:
- "Accuracy and biblical faithfulness are more important than providing an answer"
- "When in doubt, admit uncertainty rather than risk providing incorrect information"
- "Do NOT speculate, assume, or fabricate biblical information"

## What Users Can Expect

### ✅ Good Responses
- Answers grounded in specific Scripture references
- Citations like: "In Matthew 6:33, Jesus teaches..."
- Honest admissions: "I'm not certain about this from Scripture"
- Clear boundaries: "The Bible doesn't specifically address this topic"

### ❌ Avoided Behaviors
- Making up verses or references
- Drawing from non-biblical sources
- Speculating about topics not in Scripture
- Providing uncertain information as fact
- Mixing cultural wisdom with biblical teaching without distinction

## Technical Implementation

### Chat Function Configuration
```typescript
generationConfig: {
  temperature: 0.3,  // Low creativity = high accuracy
  topP: 0.8,         // Focus on probable responses
  topK: 20,          // Limit token diversity
}
```

### System Instruction (Summary)
The AI receives a comprehensive system instruction that includes:
1. Identity as a biblical assistant for RCCG The Eagles Ark
2. Current theme and daily scripture context
3. 8 critical requirements for biblical accuracy
4. Explicit reminder about honesty over completeness

## Monitoring & Feedback

If users encounter responses that seem inaccurate or not biblically grounded:
1. Note the specific question asked
2. Save the AI's response
3. Report to admin (tech@rccgtea.org)
4. We can further refine the system instructions

## Continuous Improvement

The AI assistant will be monitored and improved based on:
- User feedback about accuracy
- Examples of problematic responses
- Updates to Gemini API capabilities
- Best practices for biblical AI applications

---

**Last Updated:** October 28, 2025  
**Contact:** tech@rccgtea.org
