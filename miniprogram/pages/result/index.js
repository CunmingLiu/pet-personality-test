/**
 * 与 defaultResults.animalKey 对应；资源使用纯英文文件名，避免旧版 canvas drawImage
 * 在部分真机上对中文路径 / 包内路径解码失败（仅显示灰底圆角占位）。
 */
const PET_IMAGE_BY_KEY = {
  golden: "/images/pet/golden.jpg",
  shiba: "/images/pet/shiba.jpg",
  borderCollie: "/images/pet/borderCollie.jpg",
  samoyed: "/images/pet/samoyed.jpg",
  ragdoll: "/images/pet/ragdoll.jpg",
  britishShorthair: "/images/pet/britishShorthair.jpg",
  orangeCat: "/images/pet/orangeCat.jpg",
  rabbit: "/images/pet/rabbit.jpg",
  deer: "/images/pet/deer.jpg",
  fox: "/images/pet/fox.jpg"
};

function resolvePetImageUrl(hit) {
  if (!hit || !hit.animalKey) return "";
  return PET_IMAGE_BY_KEY[hit.animalKey] || hit.imageUrl || "";
}

Page({
  data: {
    loading: true,
    result: {
      animalKey: "golden",
      title: "金毛系·阳光治愈犬",
      tags: ["阳光", "治愈", "共情强"],
      desc: "你像金毛一样温暖开朗，能快速感染身边气氛。面对压力时，你更倾向于积极行动，也愿意给朋友稳定的支持与陪伴。",
      imageUrl: PET_IMAGE_BY_KEY.golden
    }
  },

  onLoad(options) {
    const resultKey = options.resultKey || "golden";
    this.loadResult(resultKey);
  },

  async loadResult(resultKey) {
    this.setData({ loading: true });

    try {
      const resp = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: { type: "getResults" }
      });
      const list = (resp.result && resp.result.data) || [];
      const hit = list.find((item) => item.animalKey === resultKey) || list[0];
      if (hit) {
        const imageUrl = resolvePetImageUrl(hit);
        this.setData({ result: { ...hit, imageUrl } });
      }
    } catch (err) {
      wx.showToast({ title: "结果加载失败", icon: "none" });
      console.warn("loadResult failed", err);
    } finally {
      this.setData({ loading: false });
    }
  },

  onShareAppMessage() {
    return {
      title: `我测出了${this.data.result.title}，你也来试试吧！`,
      path: "/pages/index/index"
    };
  },

  onShareTimeline() {
    return {
      title: `我测出了${this.data.result.title}，你也来试试吧！`
    };
  },

  onSavePoster() {
    const { result } = this.data;
    const imageSrc = result.imageUrl || "";

    const finish = (imagePath, imgW, imgH) => {
      this.drawPosterToCanvas(result, imagePath, imgW, imgH);
    };

    if (!imageSrc) {
      finish("", 0, 0);
      return;
    }

    wx.getImageInfo({
      src: imageSrc,
      success: (info) => {
        const tmpPath = `${wx.env.USER_DATA_PATH}/poster_pet.jpg`;
        try {
          wx.getFileSystemManager().copyFileSync(info.path, tmpPath);
          finish(tmpPath, info.width, info.height);
        } catch (e) {
          console.warn("poster copyFileSync fallback to package path", e);
          finish(info.path, info.width, info.height);
        }
      },
      fail: (err) => {
        console.warn("getImageInfo failed", err);
        finish("", 0, 0);
      }
    });
  },

  drawPosterToCanvas(result, imagePath, imgW, imgH) {
    const ctx = wx.createCanvasContext("posterCanvas", this);
    const width = 600;
    const height = 900;
    const pad = 42;
    const innerW = width - pad * 2;

    const roundRectPath = (x, y, w, h, r) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.arc(x + w - rr, y + rr, rr, -Math.PI / 2, 0);
      ctx.lineTo(x + w, y + h - rr);
      ctx.arc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2);
      ctx.lineTo(x + rr, y + h);
      ctx.arc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI);
      ctx.lineTo(x, y + rr);
      ctx.arc(x + rr, y + rr, rr, Math.PI, (Math.PI * 3) / 2);
      ctx.closePath();
    };

    // 背景
    ctx.setFillStyle("#f6efe9");
    ctx.fillRect(0, 0, width, height);

    // 主卡片
    const card = { x: 20, y: 20, w: width - 40, h: height - 40 };
    ctx.setFillStyle("#fff7f2");
    roundRectPath(card.x, card.y, card.w, card.h, 26);
    ctx.fill();
    ctx.setStrokeStyle("rgba(255, 163, 122, 0.28)");
    ctx.setLineWidth(2);
    roundRectPath(card.x, card.y, card.w, card.h, 26);
    ctx.stroke();

    // 顶部暖色区（无边框、无圆角）
    ctx.setFillStyle("#fff7f2");
    ctx.fillRect(card.x + 14, card.y + 14, card.w - 28, 118);

    // 标题
    ctx.setFillStyle("#1d2939");
    ctx.setFontSize(30);
    ctx.fillText("萌宠系性格测试", pad + 6, 78);

    ctx.setFillStyle("#98a2b3");
    ctx.setFontSize(20);
    ctx.fillText("你的专属动物人格", pad + 6, 110);

    // 图片区（圆形居中）
    const circleSize = 286;
    const circleR = circleSize / 2;
    const circleCx = width / 2;
    const circleCy = 298;
    const imgBox = {
      x: circleCx - circleR,
      y: circleCy - circleR,
      w: circleSize,
      h: circleSize,
    };
    let bodyTop = imgBox.y + imgBox.h + 56;

    if (imagePath && imgW > 0 && imgH > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(circleCx, circleCy, circleR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const scale = Math.max(imgBox.w / imgW, imgBox.h / imgH);
      const dw = imgW * scale;
      const dh = imgH * scale;
      const dx = imgBox.x + (imgBox.w - dw) / 2;
      const dy = imgBox.y + (imgBox.h - dh) / 2;
      ctx.drawImage(imagePath, dx, dy, dw, dh);
      ctx.restore();
    } else {
      bodyTop = 188;
    }

    // 结果标题
    ctx.setFillStyle("#ff7a45");
    ctx.setFontSize(32);
    const title = result.title || "测试结果";
    const titleLines = this.wrapTextByWidth(ctx, title, innerW);
    const titleLineH = 42;
    titleLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, pad, bodyTop + idx * titleLineH);
    });

    // 标签
    ctx.setFillStyle("#b54708");
    ctx.setFontSize(22);
    const tags = result.tags || [];
    const tagColW = 70;
    const titleRows = Math.max(1, titleLines.slice(0, 2).length);
    const tagStartY = bodyTop + titleRows * titleLineH + 3;
    const tagLineH = 36;
    const tagStartX = pad + 6;
    tags.forEach((tag, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      ctx.fillText(`#${tag}`, tagStartX + col * tagColW, tagStartY + row * tagLineH);
    });

    // 描述
    ctx.setFillStyle("#475467");
    ctx.setFontSize(22);
    const text = result.desc || "";
    const lines = this.wrapTextByWidth(ctx, text, innerW);
    const tagRows = tags.length === 0 ? 0 : Math.ceil(tags.length / 3);
    const descTop = tagStartY + (tagRows ? tagRows * tagLineH + 10 : 10);
    const lineStep = 38;

    // 为底部文案预留空间，动态计算可展示行数，避免出现大面积空白
    const footerY = height - 48;
    const contentBottomSafe = footerY - 26;
    const availableH = Math.max(0, contentBottomSafe - descTop);
    const maxDescLines = Math.max(2, Math.floor(availableH / lineStep));

    lines.slice(0, maxDescLines).forEach((line, idx) => {
      ctx.fillText(line, pad, descTop + idx * lineStep);
    });

    // 底部提示
    ctx.setFillStyle("#98a2b3");
    ctx.setFontSize(18);
    ctx.fillText("愿你像自己的专属小动物一样发光", pad, footerY);

    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath(
          {
            canvasId: "posterCanvas",
            width,
            height,
            destWidth: width,
            destHeight: height,
            success: (res) => {
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: () => {
                  wx.showToast({ title: "海报已保存", icon: "success" });
                },
                fail: () => {
                  wx.showToast({ title: "保存失败，请授权相册权限", icon: "none" });
                }
              }, this);
            },
            fail: (e) => {
              console.warn("canvasToTempFilePath failed", e);
              wx.showToast({ title: "海报生成失败", icon: "none" });
            }
          },
          this
        );
      }, 150);
    });
  },

  wrapTextByWidth(ctx, text, maxWidth) {
    if (!text) return [];
    const lines = [];
    let current = "";
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      const candidate = current + ch;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = ch;
      }
    }
    if (current) lines.push(current);
    return lines;
  },

  onRetest() {
    wx.reLaunch({
      url: "/pages/index/index"
    });
  }
});
