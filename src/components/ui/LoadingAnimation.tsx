"use client";

import { BufferAnimation, type BufferAnimationProps } from "./BufferAnimation";

export type LoadingAnimationProps = BufferAnimationProps;

export function LoadingAnimation(props: BufferAnimationProps) {
  return <BufferAnimation {...props} />;
}
