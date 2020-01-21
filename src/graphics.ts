import "gm-base64";
import { GraphicOptions } from "./types/graphics.type";
import { WriteImageResponse } from "./types/writeImageResponse.type";
import * as gm from "gm";
import { basename } from "path";
import { statSync } from "fs";

export class Graphics {
  private static defaultOptions: GraphicOptions = {
    quality: 0,
    format: "png",
    size: "768x512",
    density: 72,
    savedir: "./",
    savename: "untitled",
    compression: "jpeg"
  };

  private options: GraphicOptions;

  constructor(options = Graphics.defaultOptions) {
    this.options = {
      ...Graphics.defaultOptions,
      ...options
    };
  }

  public identify(path: string, argument?: string) {
    const image = gm(path);

    return new Promise((resolve, reject) => {
      if (argument) {
        image.identify(argument, (error, data) => {
          if (error) {
            return reject(error);
          }
  
          return resolve(data.replace(/^[\w\W]+?1/, "1"));
        });
      } else {
        image.identify((error, data) => {
          if (error) {
            return reject(error);
          }
  
          return resolve(data);
        });
      }
    });
  }

  private baseCommand(stream: NodeJS.ReadableStream | Buffer, name: string) {
    const { density, size, quality, compression } = this.options;

    const [ width, height ] = (size as string).split(/x/i);

    if (!height) {
      return gm(stream, name)
        .density(density as number, density as number)
        .resize(size as number)
        .quality(quality as number)
        .compress(compression)
    }

    return gm(stream, name)
      .density(density as number, density as number)
      .resize(parseInt(width, 10), parseInt(height, 10))
      .quality(quality as number)
      .compress(compression)
  }

  public write(
    stream: NodeJS.ReadWriteStream | Buffer,
    filename: string,
    path: string,
    pageCount: number
  ): Promise<WriteImageResponse> {
    return new Promise((resolve, reject) => {
      this.baseCommand(stream, path)
        .write(filename, (error) => {
          if (error) {
            return reject(error);
          }

          return resolve({
            name: basename(filename),
            size: statSync(filename).size / 1000.0,
            path: filename,
            pageCount
          })
        });
    });
  }

  public base64(
    stream: NodeJS.ReadWriteStream | Buffer,
    filename: string,
    pageCount: number
  ): Promise<any> {
    const { format } = this.options;
    return new Promise((resolve, reject) => {
      this.baseCommand(stream, filename)
        .toBase64(format, (error, base64) => { // eslint-disable-line

        });
    });
  }
}
