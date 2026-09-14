from workers import Response, WorkerEntrypoint

import pangu


class Default(WorkerEntrypoint):
    # RPC: the gateway calls env.PY.space_text(t) directly, no HTTP in between
    async def space_text(self, t: str) -> dict:
        return {"text": pangu.spacing_text(t), "version": pangu.__version__}

    # Keeps the Worker callable on its own workers.dev URL for debugging
    async def fetch(self, request):
        t = request.query.get("t", "")
        return Response.json(await self.space_text(t))
