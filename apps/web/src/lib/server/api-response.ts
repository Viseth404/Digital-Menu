import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export class ApiException extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiException";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiException) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Database initialization failed", error);
    return NextResponse.json(
      { message: "Database is temporarily unavailable" },
      { status: 503 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "A record with this value already exists" },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "The requested record was not found" },
        { status: 404 },
      );
    }
    if (error.code === "P2021" || error.code === "P2022") {
      console.error("Database schema is out of date", error);
      return NextResponse.json(
        { message: "Database schema is not up to date" },
        { status: 503 },
      );
    }
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 },
  );
}
