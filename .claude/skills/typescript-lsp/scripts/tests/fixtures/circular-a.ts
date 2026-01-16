import type { TypeB } from './circular-b.ts'

export type TypeA = {
  name: string
  related: TypeB
}

export const functionA = (value: TypeA) => value
