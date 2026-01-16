export const Button = ({ onClick, children }) => {
  return (
    <button type='button' onClick={onClick}>
      {children}
    </button>
  )
}
