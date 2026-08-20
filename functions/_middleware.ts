const ADS_TXT =
  "google.com, pub-4615828989144194, DIRECT, f08c47fec0942fa0\n";

export const onRequest: PagesFunction = async (context) => {
  const { pathname } = new URL(context.request.url);
  if (pathname === "/ads.txt") {
    return new Response(ADS_TXT, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  }
  return context.next();
};
