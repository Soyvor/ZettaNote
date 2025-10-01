import Page from "../../models/Page.js";
import { verifyToken } from "../../util/token.js";
import { z } from "zod";

// Define schema once (outside function)
const renamePageSchema = z.object({
  token: z.string().min(1, "Token is required"),
  pageId: z.string().min(1, "Page ID is required"),
  newPageName: z.string().min(1, "New page name is required"),
});

// Helper for responses
const makeResponse = (status, message) => ({
  resStatus: status,
  resMessage: { message },
});

export default async function renamePage(req) {
  try {
    // Validate request body
    const { token, pageId, newPageName } = renamePageSchema.parse(req.body);

    // Verify user
    const user = await verifyToken(token);
    if (!user) return makeResponse(401, "User not logged in");

    // Find page
    const page = await Page.findById(pageId);
    if (!page) return makeResponse(404, "Page not found");

    // Check ownership
    if (!page.owner.equals(user._id)) {
      return makeResponse(403, "Not authorized");
    }

    // Update & save page
    page.pageName = newPageName;
    await page.save();

    // Success
    return {
      resStatus: 200,
      resMessage: { updatedPage: page },
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return makeResponse(400, err.errors.map(e => e.message).join(", "));
    }
    console.error("Rename Page Error:", err);
    return makeResponse(500, "Internal server error");
  }
}
