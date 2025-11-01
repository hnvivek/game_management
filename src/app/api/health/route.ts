import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Simple health check to verify the API is running
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Good!"
 */
export async function GET() {
  return NextResponse.json({ message: "Good!" });
}