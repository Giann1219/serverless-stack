import path from "path";
import fs from "fs-extra";
import { State } from "../../state";
import { Definition, Command, buildSync, buildAsync } from "./definition";

export const GoHandler: Definition = (opts) => {
  const artifact = State.Function.artifactsPath(opts.root, opts.id);
  const target = path.join(artifact, "handler");

  const full = path.join(opts.srcPath, opts.handler);
  const isDir = fs.lstatSync(full).isDirectory();
  const input = isDir ? path.join(opts.handler, "main.go") : opts.handler;
  if (!fs.existsSync(path.join(opts.srcPath, input)))
    throw new Error("Cannot find handler at " + input);

  const build: Command = {
    command: "go",
    args: ["build", "-ldflags", "-s -w", "-o", target, input],
    env: {},
  };
  return {
    build: () => {
      fs.removeSync(artifact);
      fs.mkdirpSync(artifact);
      return buildAsync(opts, build);
    },
    bundle: () => {
      fs.removeSync(artifact);
      fs.mkdirpSync(artifact);
      buildSync(opts, {
        ...build,
        env: {
          CGO_ENABLED: "0",
          GOOS: "linux",
        },
      });
      return {
        handler: "handler",
        directory: artifact,
      };
    },
    run: {
      command: target,
      args: [],
      env: {},
    },
    watcher: {
      include: [path.join(opts.srcPath, "**/*.go")],
      ignore: [],
    },
  };
};
