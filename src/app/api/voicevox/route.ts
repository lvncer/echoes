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

    // VOICEVOX Web APIにリクエスト（公式仕様に合わせてkeyパラメータ使用）
    const voicevoxUrl = new URL(
      `https://deprecatedapis.tts.quest/v2/voicevox${endpoint}`
    );
    voicevoxUrl.searchParams.set("key", apiKey);

    const response = await fetch(voicevoxUrl.toString(), {
      method: "GET",
      headers: {
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
  } catch {
    return NextResponse.json({ error: "内部サーバーエラー" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = request.headers.get("x-api-key");

    // 音声合成用パラメータ
    const text = searchParams.get("text");
    const speaker = searchParams.get("speaker") || "0";
    const pitch = searchParams.get("pitch") || "0";
    const speed = searchParams.get("speed") || "1";
    const intonationScale = searchParams.get("intonationScale") || "1";

    if (!apiKey) {
      return NextResponse.json(
        { error: "APIキーが指定されていません" },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "テキストが指定されていません" },
        { status: 400 }
      );
    }

    // VOICEVOX Web API音声合成エンドポイント（公式仕様）
    const voicevoxUrl = new URL(
      "https://deprecatedapis.tts.quest/v2/voicevox/audio/"
    );
    voicevoxUrl.searchParams.set("key", apiKey);
    voicevoxUrl.searchParams.set("text", text);
    voicevoxUrl.searchParams.set("speaker", speaker);
    voicevoxUrl.searchParams.set("pitch", pitch);
    voicevoxUrl.searchParams.set("speed", speed);
    voicevoxUrl.searchParams.set("intonationScale", intonationScale);

    const response = await fetch(voicevoxUrl.toString(), {
      method: "GET", // 公式仕様ではGETまたはPOST
      headers: {
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

    // 音声データを返す
    const audioData = await response.arrayBuffer();
    return new NextResponse(audioData, {
      headers: {
        "Content-Type": "audio/wav",
      },
    });
  } catch {
    return NextResponse.json({ error: "内部サーバーエラー" }, { status: 500 });
  }
}
