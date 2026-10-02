import type { MediaRenderer, RenderRequest, RenderedMedia } from '../../shared/types/rendering';

export class RenderingService {
  constructor(private readonly renderer: MediaRenderer) {}

  render(publication: RenderRequest): Promise<RenderedMedia> {
    return this.renderer.render(publication);
  }
}
