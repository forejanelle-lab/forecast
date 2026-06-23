/** Strip template boilerplate from stored audition request messages for display. */
export function formatAuditionInstructionsForDisplay(instructions: string): string {
  let text = instructions.trim();
  if (!text) return "";

  const cutAt = (pattern: RegExp) => {
    const match = pattern.exec(text);
    if (match && match.index > 0) {
      text = text.slice(0, match.index).trim();
    }
  };

  cutAt(/\n\s*Upload requirements:\s*\n/i);
  cutAt(/\n\s*Attached materials included with this request:\s*\n/i);
  cutAt(/\n\s*Please upload your audition through Fore Cast/i);
  cutAt(/\n\s*Best,\s*\n/i);

  return text.trim();
}
