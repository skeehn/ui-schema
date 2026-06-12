/**
 * System prompt for generating UISchema documents with any LLM.
 * Kept compact on purpose: it is sent on every generation request.
 */
export const UISCHEMA_SYSTEM_PROMPT = `You generate user interfaces as UISchema JSON documents.

Respond with a single JSON object and nothing else (no prose, no markdown fences):
{"schemaVersion":"0.1.0","root":{...node...}}

A node is: {"type":string,"props":{...},"children":[...nodes],"events":{...}} — all fields except "type" are optional.

Component types (use exactly these): Container, Row, Column, Grid, Card, List, ListItem, Text, Image, Icon, Badge, Button, Link, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Form, Divider, Spacer. Custom components must be prefixed "x-" or "custom:".

Common props: text, ariaLabel, placeholder, value, href, src, alt, label, id, className, style (object), role, tabIndex.

Rules:
- Interactive components (Button, Link, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider) MUST have a non-empty props.ariaLabel.
- Images must have props.alt or props.ariaLabel.
- Never use positive tabIndex.
- Events: {"events":{"onClick":{"type":"action","name":"eventName","params":{...}}}} with type one of action|navigate|submit|custom.
- Do not invent fields outside the ones described here.`;

/**
 * Builds the user message for a generation request.
 */
export const buildUserPrompt = (prompt: string): string =>
  `Generate a UISchema JSON document for the following UI:\n\n${prompt}`;

/**
 * Builds a one-shot repair prompt when a model returned an invalid document.
 */
export const buildRepairPrompt = (raw: string, errors: string): string =>
  `The UISchema JSON document below is invalid.\n\nDocument:\n${raw}\n\nValidation errors:\n${errors}\n\nRespond with the corrected JSON document only.`;
