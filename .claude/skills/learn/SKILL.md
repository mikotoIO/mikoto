---
name: learn
description: Creates a new skill or updates an existing skill to capture new knowledge. Use when you want Claude to remember patterns, workflows, or project-specific guidance.
---

# Learning New Knowledge

## Overview

Capture knowledge into reusable skills that persist across conversations. This can include:

- Project-specific patterns and conventions
- Workflow guidance for common tasks
- Technology-specific knowledge for this codebase
- Best practices discovered during development

## The Process

**1. Understand what to learn:**

- Ask the user what knowledge they want to capture
- If invoked with context from the current conversation, identify the key insights
- Determine if this should be a new skill or an update to an existing one
- If existing skill is outdated, remove outdated information

**2. Find or create the right skill:**

- List existing skills in `.claude/skills/`
- If the knowledge fits an existing skill, prepare to update it
- If it's a new domain, create a new skill directory

**3. Write the skill content:**

Structure the skill with:

- Clear, actionable guidance
- Code examples where relevant
- Common patterns and anti-patterns
- When to use this knowledge

**4. Validate with the user:**

- Show the proposed skill content
- Ask if anything should be added or changed
- Confirm before writing

## Skill File Format

Skills live in `.claude/skills/<skill-name>/SKILL.md`:

```markdown
---
name: skill-name
description: Brief description shown in skill list. Explains when this skill should be activated.
---

# Skill Title

## Overview

What this skill covers and when to use it.

## Key Content

The actual guidance, patterns, examples, etc.
```

## Guidelines

- **Keep skills focused** - One skill per domain/topic
- **Be specific to this project** - Generic knowledge doesn't need a skill
- **Include examples** - Show, don't just tell
- **Update over improve** - Prefer updating existing skills over creating overlapping ones
- **Descriptive names** - Skill names should clearly indicate their purpose
