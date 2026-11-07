declare module "pgpass" {
  export default function pgpass(
    target: { host?: string; port?: number; database?: string; user?: string },
    found: (password: string | undefined) => void,
  ): void;
}
