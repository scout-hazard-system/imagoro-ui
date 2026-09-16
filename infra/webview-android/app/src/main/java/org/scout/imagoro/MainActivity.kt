package org.scout.imagoro

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity

/**
 * Open-source WebView host for the imagoro command-center shell.
 * Loads the vite-produced bundle from assets (file:///android_asset/www).
 * No Play Services, no proprietary SDK. Reference scaffold for [verify] on a
 * host with android-34 + JDK 17.
 */
@SuppressLint("SetJavaScriptEnabled")
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            setSupportZoom(false)
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                super.onReceivedError(view, request, error)
            }
        }

        webView.loadUrl("file:///android_asset/www/index.html")
    }
}