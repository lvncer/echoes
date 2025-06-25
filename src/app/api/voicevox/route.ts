import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const apiKey = request.headers.get("x-api-key");

    if (!endpoint) {
      return NextResponse.json(
        { error: "エンドポイントが指定されていません" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "APIキーが指定されていません" },
        { status: 400 }
      );
    }

    // VOICEVOX Web APIにリクエスト
    const voicevoxUrl = `https://deprecatedapis.tts.quest/v2/voicevox${endpoint}`;
    const response = await fetch(voicevoxUrl, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.errorMessage || "VOICEVOX APIエラー" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("VOICEVOX プロキシエラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラー" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const apiKey = request.headers.get("x-api-key");
    const body = await request.text();

    if (!endpoint) {
      return NextResponse.json(
        { error: "エンドポイントが指定されていません" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "APIキーが指定されていません" },
        { status: 400 }
      );
    }

    // VOICEVOX Web APIにリクエスト
    const voicevoxUrl = `https://deprecatedapis.tts.quest/v2/voicevox${endpoint}`;
    const response = await fetch(voicevoxUrl, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.errorMessage || "VOICEVOX APIエラー" },
        { status: response.status }
      );
    }

    // 音声データの場合はそのまま返す
    if (response.headers.get("content-type")?.includes("audio")) {
      const audioData = await response.arrayBuffer();
      return new NextResponse(audioData, {
        headers: {
          "Content-Type": "audio/wav",
        },
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("VOICEVOX プロキシエラー:", error);
    return NextResponse.json(
      { error: "内部サーバーエラー" },
      { status: 500 }
    );
  }
} 