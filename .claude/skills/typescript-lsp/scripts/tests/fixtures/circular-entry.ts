import { functionA } from './circular-a.ts'
import { functionB } from './circular-b.ts'

export const useCircular = () => {
  return { functionA, functionB }
}
