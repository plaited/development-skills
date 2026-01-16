import type { TypeA } from './circular-a.ts'

export type TypeB = {
  id: number
  related: TypeA
}

export const functionB = (value: TypeB) => value
