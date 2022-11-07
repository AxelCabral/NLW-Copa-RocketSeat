import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function guessRoutes(fastify: FastifyInstance) {
    fastify.get('/guesses/count', async () => {

        const count = await prisma.guess.count();

        return { count }
    });

    fastify.get("/guesses/count", async () => {
        const count = await prisma.guess.count();
        return { count };
    });

    fastify.post(
        "/pools/:poolId/games/:gameId/guesses",
        {
            onRequest: [authenticate],
        },
        async (request, reply) => {
            const createGuessParams = z.object({
                poolId: z.string(),
                gameId: z.string(),
            });

            const createGuessBody = z.object({
                firstTeamPoints: z.number(),
                secondTeamPoints: z.number(),
            });

            const { poolId, gameId } = createGuessParams.parse(request.params);
            const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(request.body);

            const participant = await prisma.partipant.findUnique({
                where: {
                    userId_poolId: {
                        poolId,
                        userId: request.user.sub,
                    },
                },
            });

            if (!participant) {
                return reply.status(400).send({
                    message: "You are not allowed to create a guess inside this pool.",
                });
            }

            const guess = await prisma.guess.findUnique({
                where: {
                    partipantId_gameId: {
                        partipantId: participant.id,
                        gameId
                    }
                }
            });

            if (guess) {
                return reply.status(400).send({
                    message: "You already sent a guess to this game in this pool.",
                });
            }

            const game = await prisma.game.findUnique({
                where: {
                    id: gameId,
                },
            });

            if (!game) {
                return reply.status(400).send({
                    message: "Game not found.",
                });
            }

            if (game.date < new Date()) {
                return reply.status(400).send({
                    message: "You cannot send guesses after the game date.",
                });
            }

            await prisma.guess.create({
                data: {
                    gameId,
                    partipantId: participant.id,
                    firstTeamPoints,
                    secondTeamPoints,
                }
            });

            return reply.status(201).send();
        }
    );
}