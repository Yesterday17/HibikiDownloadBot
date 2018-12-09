import request from "request-promise";

export async function HiBiKiGet(
  url: string
): Promise<{ error: string; reply: string }> {
  const body = await request
    .get(url, {
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    })
    .catch(error => error);
  if (!body) return { error: "发生错误！", reply: "" };

  return { error: "", reply: body };
}

export async function getPlaylistUrl(
  id: string
): Promise<{ error: string; reply: string }> {
  const response = await HiBiKiGet(
    `https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=${id}`
  );

  /**
   * Error occurred when trying to get
   */
  if (response.error !== "") return response;

  const reply = JSON.parse(response.reply);

  /**
   * Error with the content
   */
  if (!reply.playlist_url) {
    return {
      error: `无法获取下载地址!!!\nID: ${id}\n错误信息: ${reply.error_message}`,
      reply: ""
    };
  }
  return { error: "", reply: reply.playlist_url };
}

export async function getDailyVoice(): Promise<{
  error: string;
  reply: string;
}> {
  return await HiBiKiGet("https://vcms-api.hibiki-radio.jp/api/v1/daily_voice");
}
