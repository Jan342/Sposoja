FROM eclipse-temurin:17-jdk-jammy

RUN apt-get update && apt-get install -y wget unzip
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools && \
    wget https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip -O cmdline-tools.zip && \
    unzip cmdline-tools.zip -d $ANDROID_SDK_ROOT/cmdline-tools && \
    mv $ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest && \
    rm cmdline-tools.zip

RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-36" "build-tools;34.0.0"

WORKDIR /app
COPY . .
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

CMD ["./gradlew", "assembleDebug"]