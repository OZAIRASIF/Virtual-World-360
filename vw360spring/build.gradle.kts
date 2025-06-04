plugins {
	java
	id("org.springframework.boot") version "3.3.12"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.vw360"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.current()
    targetCompatibility = JavaVersion.current()
}


repositories {
	mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("com.cloudinary:cloudinary-http44:1.29.0")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.1.0")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> {
	useJUnitPlatform()
}
