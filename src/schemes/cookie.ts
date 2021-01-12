import type {
  SchemePartialOptions,
  SchemeCheck,
  HTTPRequest,
  HTTPResponse,
  TokenableScheme
} from '../types'
import type { Auth } from '../core'
import { LocalScheme, LocalSchemeEndpoints, LocalSchemeOptions } from './local'

export interface CookieSchemeEndpoints extends LocalSchemeEndpoints {
  csrf: HTTPRequest
}

export interface CookieSchemeCookie {
  name: string
}

export interface CookieSchemeOptions extends LocalSchemeOptions {
  endpoints: CookieSchemeEndpoints
  cookie: CookieSchemeCookie
}

const DEFAULTS: SchemePartialOptions<CookieSchemeOptions> = {
  name: 'cookie',
  cookie: {
    name: null
  },
  token: {
    type: '',
    property: '',
    maxAge: false,
    global: false,
    required: false
  },
  endpoints: {
    csrf: null
  }
}

export class CookieScheme<
    OptionsT extends CookieSchemeOptions = CookieSchemeOptions
  >
  extends LocalScheme<OptionsT>
  implements TokenableScheme<OptionsT> {
  constructor($auth: Auth, options: SchemePartialOptions<CookieSchemeOptions>) {
    console.log('CookieScheme constructor')
    super($auth, options, DEFAULTS)
  }

  mounted(): Promise<HTTPResponse | void> {
    if (process.server) {
      this.$auth.ctx.$axios.setHeader(
        'referer',
        this.$auth.ctx.req.headers.host
      )
    }

    return super.mounted()
  }

  check(): SchemeCheck {
    const response = { valid: false }
    console.log('CookieScheme check')

    if (!super.check().valid) {
      console.log('CookieScheme check failed')
      return response
    }

    console.log('CookieScheme cookie name:', this.options.cookie.name)
    if (this.options.cookie.name) {
      const cookies = this.$auth.$storage.getCookies()
      response.valid = Boolean(cookies[this.options.cookie.name])
      console.log('CookieScheme response:', response.valid)
      return response
    }

    response.valid = true
    console.log('CookieScheme returning true')
    return response
  }

  async login(endpoint: HTTPRequest): Promise<HTTPResponse> {
    // Ditch any leftover local tokens before attempting to log in
    this.$auth.reset()
    console.log('CookieScheme login')
    // Make CSRF request if required
    if (this.options.endpoints.csrf) {
      await this.$auth.request(this.options.endpoints.csrf, {
        maxRedirects: 0
      })
    }

    return super.login(endpoint, { reset: false })
  }

  reset(): void {
    console.log('CookieScheme reset')
    if (this.options.cookie.name) {
      this.$auth.$storage.setCookie(this.options.cookie.name, null, {
        prefix: ''
      })
    }

    return super.reset()
  }
}
