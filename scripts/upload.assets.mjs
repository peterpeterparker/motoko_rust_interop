import { readFile } from "fs/promises";
import { bucketActor } from "./bucket.actor.mjs";

const uploadHtml = async ({ name, folder, src, fullPath }) => {
  const buffer = await readFile(src);

  const { batchId } = await bucketActor.initUpload({
    name,
    mimeType: "text/html",
    fullPath,
    token: [],
    folder,
    sha256: [],
  });

  console.log(`[${name}] Init.`);

  const chunkSize = 700000;
  const promises = [];

  const upload = async (chunks) => {
    const { chunkId } = await bucketActor.uploadChunk({
      batchId,
      content: [...new Uint8Array(chunks)],
    });

    console.log(`[${name} - ${chunkId}] Chunk.`);
  };

  for (let start = 0; start < buffer.length; start += chunkSize) {
    const chunks = buffer.slice(start, start + chunkSize);
    promises.push(upload(chunks));
  }

  await Promise.all(promises);

  console.log(`[${name}] Chunks.`);

  await bucketActor.commitUpload({
    batchId,
    chunkIds: [chunkId],
    headers: [
      ["Content-Type", "text/html"],
      ["accept-ranges", "bytes"],
      ...[["Cache-Control", `max-age=0`]],
    ],
  });

  console.log(`[${name}] Commit.`);
};

const uploadAssets = async () => {
  await Promise.all([
    uploadHtml({
      src: "./data/index.html",
      name: "index.html",
      folder: "resources",
      fullPath: "/",
    }),
    uploadHtml({
      src: "./data/post.html",
      name: "post1234",
      folder: "d",
      fullPath: "/d/post1234",
    }),
  ]);
};

uploadAssets().then(() => {
  console.log("Done.");
});