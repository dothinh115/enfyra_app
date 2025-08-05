export { default as LoadingDots } from './Dots.vue';
export { default as LoadingSpinner } from './Spinner.vue';
export { default as LoadingBars } from './Bars.vue';
export { default as LoadingSkeleton } from './Skeleton.vue';
export { default as LoadingProgress } from './Progress.vue';
export { default as LoadingPulse } from './Pulse.vue';
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface DotsProps extends LoadingProps {
  type?: 'bounce' | 'pulse' | 'wave';
}

export interface SpinnerProps extends LoadingProps {
  type?: 'ring' | 'crescent' | 'dashed';
}

export interface BarsProps extends LoadingProps {
  count?: number;
}

export interface SkeletonProps {
  type?: 'text' | 'avatar' | 'card' | 'table' | 'form';
  lines?: number;
  animated?: boolean;
}

export interface ProgressProps extends LoadingProps {
  value?: number;
  type?: 'linear' | 'circular';
  indeterminate?: boolean;
}

export interface PulseProps extends LoadingProps {
  type?: 'ripple' | 'breath' | 'heart';
}