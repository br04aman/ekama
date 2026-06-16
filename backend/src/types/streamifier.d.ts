declare module 'streamifier' {
  import { Readable } from 'stream';

  export function createReadStream(input: unknown): Readable;

  const streamifier: {
    createReadStream: typeof createReadStream;
  };

  export default streamifier;
}
