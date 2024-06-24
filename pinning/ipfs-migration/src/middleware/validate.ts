import { type NextFunction, type Request, type Response } from 'express'

export default (schema: any, intercept: any, allowUnknown = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = intercept.body ? { ...req.body } : { ...req.query }

    const defaultPayload = schema.validate(payload, { stripUnknown: true }).value
    intercept.body ? (req.body = defaultPayload) : (req.query = defaultPayload)
    const validated = schema.validate(payload, { allowUnknown })
    if (validated.error) {
      const error = {
        message: validated.error.details[0].message.replace(/"/g, ''),
        param: validated.error.details[0].context.key,
      }

      return res.status(400).json({ error: error })
    }
    next()
  }
}
