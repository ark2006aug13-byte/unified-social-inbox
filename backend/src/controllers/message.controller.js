import { getUnifiedMessageById, listUnifiedMessages } from "../services/unifiedInboxService.js";

function getRuntime(req) {
  return {
    sessionTokens: req.session?.tokens || null,
    email: req.auth?.email || req.session?.user?.email || "",
  };
}

export async function getMessages(req, res, next) {
  try {
    const messages = await listUnifiedMessages(
      req.auth.sub,
      {
        query: req.query.q?.toString() || "",
        provider: req.query.provider?.toString() || "",
        category: req.query.category?.toString() || "",
        limit: req.query.limit ? Number(req.query.limit) : 50,
      },
      getRuntime(req),
    );

    return res.json({
      messages,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMessage(req, res, next) {
  try {
    const message = await getUnifiedMessageById(req.auth.sub, req.params.id, getRuntime(req));
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    return res.json({
      message,
    });
  } catch (error) {
    return next(error);
  }
}
