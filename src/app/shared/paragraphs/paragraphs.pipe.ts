/**
 * @file Pipe splitting stored text into paragraphs.
 */

import { Pipe, PipeTransform } from '@angular/core';

/** A blank line (optionally containing whitespace), with \n or \r\n line endings. */
const PARAGRAPH_BREAK = /\r?\n\s*\r?\n/;

/** `text | paragraphs`: paragraphs separated by a blank line, trimmed, empty ones removed. */
@Pipe({ name: 'paragraphs', standalone: true })
export class ParagraphsPipe implements PipeTransform {
  transform(text: string): string[] {
    return text
      .split(PARAGRAPH_BREAK)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }
}
