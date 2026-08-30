---
title: Makine Öğrenmesi (ML) Nedir?
description: Makine öğrenmesi nedir ve nasıl çalışır?
slug: makine-ogrenmesi-nedir
category: teknoloji
subcategory: yapay-zeka
topic: makine-ogrenmesi
type: article
status: published
author: Bilgirasyon
datePublished: 2026-08-30
dateModified: 2026-08-30
cover: /assets/images/thumbnails/makine-ogrenmesi.webp
---

# Makine Öğrenmesi (ML) Nedir?

Makine öğrenmesi (Machine Learning – ML), bilgisayarların açıkça programlanmadan veri üzerinden öğrenmesini sağlayan bir yapay zeka alt dalıdır.

## Makine öğrenmesi nedir?

Makine öğrenmesi, veriyi analiz ederek örüntüleri öğrenen ve bu bilgiyi kullanarak tahmin yapan sistemlerdir. Günümüzde spam filtreleri, öneri algoritmaları ve finansal analiz sistemleri gibi birçok alanda aktif olarak kullanılır.

Klasik yazılımlarda kurallar insan tarafından tek tek yazılırken, makine öğrenmesinde sistem bu kuralları veriden kendisi çıkarır.

Bu noktada konuyu daha geniş çerçevede anlamak için **Yapay Zeka Nedir** içeriğine bakmak kritik çünkü makine öğrenmesi, yapay zekanın en aktif kullanılan kısmıdır.

En basit tanımıyla:

Makine öğrenmesi = **veri + algoritma + öğrenme süreci**

Bir model, geçmiş verileri analiz eder, örüntüleri yakalar ve bu bilgiyi kullanarak yeni veriler hakkında tahmin üretir.

| Gerçek Hayattan Örnekler            |
| ----------------------------------- |
| E-posta spam filtreleri             |
| Netflix ve YouTube öneri sistemleri |
| Bankacılıkta dolandırıcılık tespiti |
| Google arama sonuçları sıralaması   |

👉 Bugün kullandığın neredeyse tüm akıllı sistemlerin arkasında makine öğrenmesi vardır.

---

## Makine Öğrenmesi Nasıl Çalışır?

Makine öğrenmesi sihir değil, sistematik bir süreçtir. Bu süreci anlamadan konuyu tam kavrayamazsın.

### 1. Veri Toplama

Modelin öğrenmesi için veri gerekir. Veri ne kadar doğru ve büyükse model o kadar iyi sonuç verir.

👉 Kritik nokta: Kötü veri = kötü model

### 2. Veri İşleme (Preprocessing)

Ham veri genellikle kirli ve düzensizdir:

- Eksik veriler temizlenir
- Gürültü azaltılır
- Format düzenlenir

Bu aşama doğrudan **Veri Bilimi** ile bağlantılıdır ve çoğu zaman projenin en kritik kısmıdır.

### 3. Özellik Çıkarma (Feature Engineering)

Veri içindeki önemli sinyaller seçilir.

👉 Yanlış feature seçimi → model çöp olur

### 4. Model Seçimi

Probleme uygun **Algoritmalar** seçilir:

- Sınıflandırma
- Regresyon
- Kümeleme

### 5. Eğitim (Training)

Model veriyi analiz eder ve hatalarını minimize ederek öğrenir.

### 6. Değerlendirme (Evaluation)

Model daha önce görmediği veri ile test edilir.

👉 Amaç: Genelleme yapabiliyor mu?

### 7. Tahmin (Prediction)

Artık model gerçek dünyada kullanılabilir.

---

### Sürecin Özeti

| Aşama               | Ne Yapılır                 | Kritik Nokta          |
| ------------------- | -------------------------- | --------------------- |
| Veri Toplama        | Veri elde edilir           | Veri kalitesi         |
| Veri Temizleme      | Gürültü giderilir          | Veri doğruluğu        |
| Feature Engineering | Önemli değişkenler seçilir | Model performansı     |
| Model Eğitimi       | Model öğrenir              | Overfitting riski     |
| Test                | Performans ölçülür         | Gerçek dünya başarısı |

---

## Denetimli Öğrenme (Supervised Learning)

Denetimli öğrenme en yaygın kullanılan yöntemdir.

Mantık basit:  
Model hem girdiyi hem doğru cevabı görür.

### Nerelerde kullanılır?

- Spam filtreleme
- Kredi skoru hesaplama
- Hastalık teşhisi

### Problem Türleri

| Tür            | Açıklama        | Örnek        |
| -------------- | --------------- | ------------ |
| Classification | Kategorik çıktı | Spam / değil |
| Regression     | Sayısal çıktı   | Ev fiyatı    |

### Avantaj & Dezavantaj

| Avantaj            | Dezavantaj               |
| ------------------ | ------------------------ |
| Yüksek doğruluk    | Etiketli veri gerekir    |
| Tahmin gücü yüksek | Veri hazırlama maliyetli |

---

## Denetimsiz Öğrenme (Unsupervised Learning)

Burada model yalnızca veriyi görür, doğru cevap verilmez.

Amaç:  
→ Verinin içindeki gizli yapıyı keşfetmek

### En yaygın kullanım:

| Teknik                   | Açıklama                | Kullanım              |
| ------------------------ | ----------------------- | --------------------- |
| Clustering               | Benzer verileri gruplar | Müşteri segmentasyonu |
| Dimensionality Reduction | Veri boyutunu azaltır   | Görselleştirme        |

### Avantaj & Dezavantaj

| Avantaj           | Dezavantaj              |
| ----------------- | ----------------------- |
| Etiket gerekmez   | Yorumlamak zor          |
| Veri keşfi sağlar | Sonuç belirsiz olabilir |

---

## Reinforcement Learning (Pekiştirmeli Öğrenme)

Bu model tamamen farklı çalışır.

Sistem:

- Aksiyon alır
- Sonuç görür
- Ödül veya ceza alır

Amaç:  
→ Maksimum ödül

### Kullanım Alanları

| Alan     | Örnek             |
| -------- | ----------------- |
| Oyun     | Satranç AI        |
| Otomotiv | Otonom araç       |
| Robotik  | Endüstriyel robot |

---

## Makine Öğrenmesi Algoritma Örnekleri

Makine öğrenmesi teorik değil, algoritmalar üzerinden çalışır.

### Yaygın algoritmalar:

| Algoritma         | Ne Yapar               | Kullanım        |
| ----------------- | ---------------------- | --------------- |
| Decision Tree     | Karar ağacı kurar      | Sınıflandırma   |
| KNN               | En yakın komşuya bakar | Basit tahmin    |
| Linear Regression | Sayısal tahmin         | Fiyat analizi   |
| Random Forest     | Çoklu ağaç sistemi     | Yüksek doğruluk |

---

## Makine Öğrenmesi ve Derin Öğrenme İlişkisi

Makine öğrenmesi geniş bir alan. Bunun daha gelişmiş hali:

→ **Derin Öğrenme**

### Farklar

| Özellik        | Makine Öğrenmesi | Derin Öğrenme |
| -------------- | ---------------- | ------------- |
| Veri ihtiyacı  | Orta             | Çok yüksek    |
| Model yapısı   | Basit            | Sinir ağları  |
| Feature seçimi | Manuel           | Otomatik      |
| Performans     | Orta             | Çok yüksek    |

👉 Derin öğrenme özellikle görüntü ve ses işleme alanlarında devrim yaratmıştır.

---

## Makine Öğrenmesi Nerelerde Kullanılır?

Makine öğrenmesi artık hayatın her yerinde.

### Kullanım alanları

| Alan         | Kullanım           |
| ------------ | ------------------ |
| E-ticaret    | Ürün öneri sistemi |
| Finans       | Fraud detection    |
| Sağlık       | Hastalık teşhisi   |
| Sosyal medya | İçerik önerileri   |
| Oyun         | NPC davranışları   |

---

## Mini Case Study: Netflix Öneri Sistemi

Netflix, makine öğrenmesini en iyi kullanan sistemlerden biridir.

Nasıl çalışır?

- İzlediğin içerikler analiz edilir
- Benzer kullanıcılar bulunur
- Sana özel öneriler sunulur

### Kullanılan veri türleri

| Veri           | Açıklama          |
| -------------- | ----------------- |
| İzleme süresi  | İlgi düzeyi       |
| Tür tercihleri | Kullanıcı profili |
| Etkileşim      | Davranış analizi  |

👉 Bu sistem tamamen makine öğrenmesi + veri analizi üzerine kuruludur.

---

## Makine Öğrenmesi vs Klasik Programlama

### Karşılaştırma

| Sistem             | Mantık                  |
| ------------------ | ----------------------- |
| Klasik Programlama | Veri + Kurallar → Sonuç |
| Makine Öğrenmesi   | Veri + Sonuç → Kurallar |

👉 Artık kuralları insan yazmaz → sistem öğrenir

---

## Makine Öğrenmesi Öğrenmek İçin Gerekenler

Bu alana girmek isteyenler için net yol:

### Temel Gereksinimler

| Alan         | İçerik                    |
| ------------ | ------------------------- |
| Matematik    | Lineer cebir, istatistik  |
| Programlama  | Python                    |
| Kütüphaneler | NumPy, Pandas             |
| Veri Analizi | Temizleme, görselleştirme |

---

## Sık Sorulan Sorular (FAQ)

### Makine öğrenmesi zor mu?

Başlangıçta zor görünebilir ancak temel kavramlar öğrenildiğinde ilerlemek kolaylaşır.

### Python bilmeden öğrenilir mi?

Hayır. Pratik yapmak için Python bilmek şarttır.

### Makine öğrenmesi nereden öğrenilir?

Online kurslar, projeler ve veri setleri ile öğrenilebilir.

---

## Sonuç

Makine öğrenmesi, modern teknolojinin temelidir.

Sistem:

- Veriyi analiz eder
- Öğrenir
- Tahmin üretir

Bu sayede:

- Otomasyon artar
- İnsan müdahalesi azalır
- Karar sistemleri güçlenir

👉 Eğer konuyu derinlemesine anlamak istiyorsan şu içeriklere geç:

- Yapay Zeka Nedir
- Algoritmalar
- Derin Öğrenme
- Veri Bilimi

Bu içerikler birlikte okunduğunda konu tam oturur.
