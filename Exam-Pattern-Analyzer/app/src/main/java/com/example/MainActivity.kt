package com.example

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

  private var webView: WebView? = null
  private var filePathCallback: ValueCallback<Array<Uri>>? = null

  private val fileChooserLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      val uris: Array<Uri>? =
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
          val dataString = result.data?.dataString
          val clipData = result.data?.clipData
          if (clipData != null && clipData.itemCount > 0) {
            Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
          } else if (dataString != null) {
            arrayOf(Uri.parse(dataString))
          } else {
            null
          }
        } else {
          null
        }
      filePathCallback?.onReceiveValue(uris)
      filePathCallback = null
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    setContent {
      MyApplicationTheme {
        ExamPatternAnalyzerApp(
          onAttachWebView = { wv -> webView = wv },
          onOpenFileChooser = { callback, intent ->
            filePathCallback = callback
            fileChooserLauncher.launch(intent)
          }
        )
      }
    }
  }

  override fun onDestroy() {
    webView?.destroy()
    webView = null
    super.onDestroy()
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExamPatternAnalyzerApp(
  onAttachWebView: (WebView) -> Unit,
  onOpenFileChooser: (ValueCallback<Array<Uri>>, Intent) -> Unit
) {
  val context = LocalContext.current
  val prefs = remember { context.getSharedPreferences("epa_prefs", Context.MODE_PRIVATE) }
  val defaultAssetUrl = "file:///android_asset/www/index.html"
  var currentUrl by remember {
    mutableStateOf(prefs.getString("server_url", defaultAssetUrl) ?: defaultAssetUrl)
  }

  var isLoading by remember { mutableStateOf(true) }
  var loadingProgress by remember { mutableFloatStateOf(0f) }
  var hasError by remember { mutableStateOf(false) }
  var errorMessage by remember { mutableStateOf("") }

  var showServerDialog by remember { mutableStateOf(false) }
  var showAboutDialog by remember { mutableStateOf(false) }
  var tempUrlInput by remember { mutableStateOf(currentUrl) }

  var localWebView by remember { mutableStateOf<WebView?>(null) }

  // Camera permission launcher
  val cameraPermissionLauncher = rememberLauncherForActivityResult(
    ActivityResultContracts.RequestPermission()
  ) { isGranted ->
    if (!isGranted) {
      Toast.makeText(context, "Camera permission needed for document scanner", Toast.LENGTH_SHORT).show()
    }
  }

  LaunchedEffect(Unit) {
    if (ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.CAMERA
      ) != PackageManager.PERMISSION_GRANTED
    ) {
      cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
    }
  }

  BackHandler(enabled = localWebView?.canGoBack() == true) {
    localWebView?.goBack()
  }

  Scaffold(
    topBar = {
      TopAppBar(
        colors = TopAppBarDefaults.topAppBarColors(
          containerColor = MaterialTheme.colorScheme.surfaceVariant,
          titleContentColor = MaterialTheme.colorScheme.onSurfaceVariant
        ),
        title = {
          Column {
            Text(
              text = "Exam Pattern Analyzer",
              style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
            Text(
              text = "Analyze. Understand. Practice. • Mehedi364",
              style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.primary
              )
            )
          }
        },
        actions = {
          IconButton(onClick = { localWebView?.reload() }) {
            Icon(Icons.Default.Refresh, contentDescription = "Reload")
          }
          IconButton(onClick = {
            tempUrlInput = currentUrl
            showServerDialog = true
          }) {
            Icon(Icons.Default.Dns, contentDescription = "Server Settings")
          }
          IconButton(onClick = { showAboutDialog = true }) {
            Icon(Icons.Default.Info, contentDescription = "About")
          }
        }
      )
    }
  ) { innerPadding ->
    Box(
      modifier = Modifier
        .fillMaxSize()
        .padding(innerPadding)
    ) {
      if (hasError) {
        Column(
          modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
          horizontalAlignment = Alignment.CenterHorizontally,
          verticalArrangement = Arrangement.Center
        ) {
          Icon(
            imageVector = Icons.Default.Warning,
            contentDescription = "Error",
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(64.dp)
          )
          Spacer(modifier = Modifier.height(16.dp))
          Text(
            text = "Connection Notice",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
          )
          Spacer(modifier = Modifier.height(8.dp))
          Text(
            text = errorMessage.ifEmpty { "Unable to connect to the specified URL." },
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
          )
          Spacer(modifier = Modifier.height(24.dp))
          Row {
            Button(onClick = {
              hasError = false
              localWebView?.reload()
            }) {
              Text("Retry")
            }
            Spacer(modifier = Modifier.width(12.dp))
            Button(onClick = {
              hasError = false
              currentUrl = defaultAssetUrl
              prefs.edit().putString("server_url", defaultAssetUrl).apply()
              localWebView?.loadUrl(defaultAssetUrl)
            }) {
              Text("Use Offline App")
            }
          }
        }
      } else {
        AndroidView(
          modifier = Modifier.fillMaxSize(),
          factory = { ctx ->
            WebView(ctx).apply {
              localWebView = this
              onAttachWebView(this)
              initWebViewSettings(
                webView = this,
                onProgress = { p ->
                  loadingProgress = p / 100f
                  isLoading = p < 100
                },
                onError = { err ->
                  hasError = true
                  errorMessage = err
                },
                onOpenFileChooser = onOpenFileChooser
              )
              loadUrl(currentUrl)
            }
          },
          update = { wv ->
            if (wv.url != currentUrl) {
              wv.loadUrl(currentUrl)
            }
          }
        )
      }

      if (isLoading && !hasError) {
        LinearProgressIndicator(
          progress = { loadingProgress },
          modifier = Modifier
            .fillMaxWidth()
            .align(Alignment.TopCenter)
        )
      }
    }
  }

  if (showServerDialog) {
    AlertDialog(
      onDismissRequest = { showServerDialog = false },
      title = { Text("Server & Backend Settings") },
      text = {
        Column {
          Text(
            text = "Enter your custom cPanel / web application URL, or use the built-in offline PWA.",
            style = MaterialTheme.typography.bodySmall
          )
          Spacer(modifier = Modifier.height(12.dp))
          OutlinedTextField(
            value = tempUrlInput,
            onValueChange = { tempUrlInput = it },
            label = { Text("App URL") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
          )
          Spacer(modifier = Modifier.height(8.dp))
          TextButton(onClick = {
            tempUrlInput = defaultAssetUrl
          }) {
            Text("Reset to Built-in Offline Mode")
          }
        }
      },
      confirmButton = {
        Button(onClick = {
          val url = tempUrlInput.trim().ifEmpty { defaultAssetUrl }
          currentUrl = url
          prefs.edit().putString("server_url", url).apply()
          showServerDialog = false
          hasError = false
          localWebView?.loadUrl(url)
          Toast.makeText(context, "URL Updated", Toast.LENGTH_SHORT).show()
        }) {
          Text("Save & Load")
        }
      },
      dismissButton = {
        TextButton(onClick = { showServerDialog = false }) {
          Text("Cancel")
        }
      }
    )
  }

  if (showAboutDialog) {
    AlertDialog(
      onDismissRequest = { showAboutDialog = false },
      title = { Text("Exam Pattern Analyzer (EPA)") },
      text = {
        Column {
          Text("Analyze. Understand. Practice.", fontWeight = FontWeight.Bold)
          Spacer(modifier = Modifier.height(4.dp))
          Text("Brand: Developed by Mehedi364", color = MaterialTheme.colorScheme.primary)
          Spacer(modifier = Modifier.height(8.dp))
          Text(
            "An educational exam pattern and repetition analyzer specifically engineered for students in Bangladesh (Degree, Honours, HSC, BCS). Features OCR question extraction, duplicate & similarity detection, marks distribution, and verified 1-mark practice.",
            style = MaterialTheme.typography.bodyMedium
          )
        }
      },
      confirmButton = {
        Button(onClick = { showAboutDialog = false }) {
          Text("Close")
        }
      }
    )
  }
}

@SuppressLint("SetJavaScriptEnabled")
private fun initWebViewSettings(
  webView: WebView,
  onProgress: (Int) -> Unit,
  onError: (String) -> Unit,
  onOpenFileChooser: (ValueCallback<Array<Uri>>, Intent) -> Unit
) {
  webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
    allowFileAccess = true
    allowContentAccess = true
    databaseEnabled = true
    cacheMode = WebSettings.LOAD_DEFAULT
    useWideViewPort = true
    loadWithOverviewMode = true
    setSupportZoom(true)
    builtInZoomControls = false
    displayZoomControls = false
  }

  webView.webChromeClient = object : WebChromeClient() {
    override fun onProgressChanged(view: WebView?, newProgress: Int) {
      super.onProgressChanged(view, newProgress)
      onProgress(newProgress)
    }

    override fun onPermissionRequest(request: PermissionRequest?) {
      request?.grant(request.resources)
    }

    override fun onShowFileChooser(
      webView: WebView?,
      filePathCallback: ValueCallback<Array<Uri>>?,
      fileChooserParams: FileChooserParams?
    ): Boolean {
      if (filePathCallback == null) return false
      val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
        type = "*/*"
        putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/pdf", "image/*"))
      }
      onOpenFileChooser(filePathCallback, intent)
      return true
    }
  }

  webView.webViewClient = object : WebViewClient() {
    override fun onReceivedError(
      view: WebView?,
      request: WebResourceRequest?,
      error: WebResourceError?
    ) {
      super.onReceivedError(view, request, error)
      if (request?.isForMainFrame == true) {
        val desc = error?.description?.toString() ?: "Network error"
        onError(desc)
      }
    }

    override fun shouldOverrideUrlLoading(
      view: WebView?,
      request: WebResourceRequest?
    ): Boolean {
      val url = request?.url?.toString() ?: return false
      if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) {
        return false
      }
      return try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        view?.context?.startActivity(intent)
        true
      } catch (e: Exception) {
        false
      }
    }
  }
}
