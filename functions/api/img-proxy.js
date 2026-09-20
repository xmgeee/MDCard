/**
 * 图片代理：绕过外链防盗链 / CORS，供 MDCard 预览与导出
 * GET /api/img-proxy?url=https://...
 */

const MAX_BYTES = 8 * 1024 * 1024

function bad(msg, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

function isBlockedHost(hostname) {
  const h = String(hostname || '').toLowerCase()
  if (!h) return true
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]') return true
  if (h.endsWith('.local')) return true
  // 常见内网段
  if (/^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true
  if (h === '0.0.0.0' || h === 'metadata.google.internal') return true
  return false
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

export async function onRequestGet(context) {
  const raw = new URL(context.request.url).searchParams.get('url')
  if (!raw) return bad('missing url')

  let target
  try {
    target = new URL(raw)
  } catch {
    return bad('invalid url')
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return bad('only http(s)')
  }
  if (isBlockedHost(target.hostname)) {
    return bad('host not allowed', 403)
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MDCardImgProxy/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: target.origin + '/'
      },
      redirect: 'follow'
    })
    if (!res.ok) return bad('upstream ' + res.status, 502)

    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) return bad('too large', 413)

    const type = res.headers.get('Content-Type') || 'application/octet-stream'
    if (!type.startsWith('image/') && type !== 'application/octet-stream') {
      return bad('not an image', 415)
    }

    return new Response(buf, {
      headers: {
        'Content-Type': type.startsWith('image/') ? type : 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (e) {
    return bad(e.message || 'proxy failed', 502)
  }
}
