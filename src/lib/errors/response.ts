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
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

