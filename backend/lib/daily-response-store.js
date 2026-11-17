export async function saveDailyResponse(prisma, data) {
  const previousRequest = await prisma.dailyResponse.findUnique({
    where: { participantId_requestId: { participantId: data.participantId, requestId: data.requestId } }
  });
  if (previousRequest) return { alreadySaved: true };

  const previousDay = await prisma.dailyResponse.findUnique({
    where: { participantId_studyDay: { participantId: data.participantId, studyDay: data.studyDay } }
  });
  if (previousDay) return { conflict: true };

  try {
    await prisma.dailyResponse.create({ data });
    return { alreadySaved: false };
  } catch (error) {
    if (error.code !== "P2002") throw error;
    const savedRequest = await prisma.dailyResponse.findUnique({
      where: { participantId_requestId: { participantId: data.participantId, requestId: data.requestId } }
    });
    return savedRequest ? { alreadySaved: true } : { conflict: true };
  }
}
