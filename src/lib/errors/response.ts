import { NextResponse } from "next/server";
import { HttpError } from "./index";

type ResponseData = Record<string, unknown> | { error: string; details?: unknown };

export function jsonOk(data: ResponseData, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated(data: ResponseData, init?: ResponseInit) {
  return NextResponse.json(data, { status: 201, ...init });
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    const body: { error: string; details?: unknown } = { error: error.message };
    if (process.env.NODE_ENV !== "production" && error.details !== undefined) {
      body.details = error.details;
    }
    return NextResponse.json(body, { status: error.status });
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

