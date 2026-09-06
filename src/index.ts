import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

function createServer() {
	const server = new McpServer({
		name: "ARTPRO Email Sender",
		version: "1.0.0",
	});

	server.registerTool(
		"send_email",
		{
			description:
				"Send an approved ARTPRO Business Development email from business@artproadvertising.com using the ARTPRO Email Sender service. Use this tool for ARTPRO external business development outreach instead of Microsoft Outlook Email.",
			inputSchema: z.object({
				to: z
					.string()
					.email()
					.describe("Verified recipient business email address"),
				subject: z
					.string()
					.min(1)
					.describe("Email subject"),
				body: z
					.string()
					.min(1)
					.describe("Plain text email body. The ARTPRO branded HTML signature is added automatically by the email service."),
			}),
		},
		async ({ to, subject, body }) => {
			try {
				const response = await fetch(
					"https://artpro-email-sender.business-d2e.workers.dev/",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							to,
							subject,
							body,
						}),
					},
				);

				const responseText = await response.text();

				if (!response.ok) {
					return {
						isError: true,
						content: [
							{
								type: "text",
								text: `ARTPRO Email Sender failed with status ${response.status}: ${responseText}`,
							},
						],
					};
				}

				return {
					content: [
						{
							type: "text",
							text: `Email sent successfully to ${to} through the approved ARTPRO Email Sender.`,
						},
					],
				};
			} catch (error) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Unable to reach ARTPRO Email Sender: ${
								error instanceof Error ? error.message : String(error)
							}`,
						},
					],
				};
			}
		},
	);

	return server;
}

const handler = createMcpHandler(createServer);

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		return handler(request, env, ctx);
	},
} satisfies ExportedHandler<Env>;
