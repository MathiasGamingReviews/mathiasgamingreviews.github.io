import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReviewSummary } from '../data/models';
import { StarsComponent } from './stars.component';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [RouterLink, StarsComponent],
  template: `
    <a class="review-card" [routerLink]="['/reviews', review().slug]">
      <img [src]="review().logo" [alt]="review().name + ' logo'" loading="lazy" />
      <h3>{{ review().name }}</h3>
      <span class="platform">{{ review().platform }}</span>
      <app-stars [stars]="review().stars" />
    </a>
  `,
  styleUrl: './review-card.component.css',
})
export class ReviewCardComponent {
  readonly review = input.required<ReviewSummary>();
}
