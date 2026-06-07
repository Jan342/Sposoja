package com.example.pametnipaketnik

import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.File
import java.io.IOException

class FaceAuthClient(
    private val baseUrl: String = "http://164.8.161.201:3002",
) {
    private val client = OkHttpClient()
    private val jpegType = "image/jpeg".toMediaType()

    fun register(
        username: String,
        password: String,
        photos: List<File>,
        onResult: (Result<String>) -> Unit,
    ) {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("username", username)
            .addFormDataPart("password", password)
            .apply {
                photos.forEachIndexed { index, photo ->
                    addFormDataPart("files", "face_$index.jpg", photo.asRequestBody(jpegType))
                }
            }
            .build()

        execute("/face/register", body, "registered", onResult)
    }

    fun verifyPassword(
        username: String,
        password: String,
        onResult: (Result<String>) -> Unit,
    ) {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("username", username)
            .addFormDataPart("password", password)
            .build()

        execute("/auth/password", body, "password_valid", onResult, "challenge")
    }

    fun login(
        username: String,
        challenge: String,
        photo: File,
        onResult: (Result<String>) -> Unit,
    ) {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("username", username)
            .addFormDataPart("challenge", challenge)
            .addFormDataPart("file", "face_login.jpg", photo.asRequestBody(jpegType))
            .build()

        execute("/face/login", body, "authenticated", onResult)
    }

    private fun execute(
        path: String,
        body: MultipartBody,
        successField: String,
        onResult: (Result<String>) -> Unit,
        resultField: String = "username",
    ) {
        val request = Request.Builder()
            .url("$baseUrl$path")
            .post(body)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                onResult(Result.failure(e))
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    val rawBody = response.body?.string().orEmpty()
                    val json = runCatching { JSONObject(rawBody) }.getOrNull()
                    val detail = json?.optString("detail").orEmpty()

                    if (!response.isSuccessful) {
                        onResult(Result.failure(IOException(detail.ifBlank { "HTTP ${response.code}" })))
                        return
                    }

                    if (json?.optBoolean(successField, false) != true) {
                        onResult(Result.failure(IOException("Obraz ni bil prepoznan.")))
                        return
                    }

                    onResult(Result.success(json.optString(resultField)))
                }
            }
        })
    }
}
