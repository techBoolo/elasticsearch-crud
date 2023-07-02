class ErrorResponse extends Error {
  constructor(attrs) {
    super()
    Object.assign(this, { ...attrs })
  }
}

module.exports = ErrorResponse

