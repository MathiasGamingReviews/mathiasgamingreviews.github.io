import { Pipe, PipeTransform } from '@angular/core';

/** Splits text stored in the database into paragraphs (separated by a blank line). */
@Pipe({ name: 'paragraphs', standalone: true })
export class ParagraphsPipe implements PipeTransform {
  transform(text: string): string[] {
    return text
      .split(/\r?\n\s*\r?\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }
}
