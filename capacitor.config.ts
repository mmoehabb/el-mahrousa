import 'dotenv/config'
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.elmahrousa.app',
  appName: 'el-mahrousa',
  webDir: 'dist',
  android: {
    buildOptions: {
      keystorePath: 'elmahrousa.jks',
      keystorePassword: process.env.KEYSTORE_PASSWORD ?? '',
      keystoreAlias: 'elmahrousa',
      keystoreAliasPassword: process.env.KEYSTORE_ALIAS_PASSWORD ?? '',
      releaseType: 'APK',
    },
  },
}

export default config
